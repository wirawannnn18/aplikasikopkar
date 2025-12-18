-- =====================================================
-- SETUP DATABASE KOPERASI UNTUK PRODUCTION
-- =====================================================
-- Jalankan script ini di SQL Editor Supabase
-- Atau import ke PostgreSQL database Anda

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE (Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'kasir' CHECK (role IN ('super_admin', 'admin', 'kasir')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. MASTER DATA TABLES
-- =====================================================

-- Anggota Koperasi
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
    tanggal_keluar DATE,
    alasan_keluar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Barang
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
    barcode VARCHAR(100),
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chart of Accounts
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

-- =====================================================
-- 3. SIMPANAN TABLES
-- =====================================================

-- Simpanan Pokok
CREATE TABLE IF NOT EXISTS simpanan_pokok (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    jumlah DECIMAL(15,2) NOT NULL DEFAULT 0,
    tanggal_setor DATE DEFAULT CURRENT_DATE,
    keterangan TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simpanan Wajib
CREATE TABLE IF NOT EXISTS simpanan_wajib (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    periode VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    jumlah DECIMAL(15,2) NOT NULL DEFAULT 0,
    tanggal_setor DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'lunas' CHECK (status IN ('lunas', 'belum_lunas')),
    keterangan TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(anggota_id, periode)
);

-- Simpanan Sukarela
CREATE TABLE IF NOT EXISTS simpanan_sukarela (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    jenis VARCHAR(20) DEFAULT 'setor' CHECK (jenis IN ('setor', 'tarik')),
    jumlah DECIMAL(15,2) NOT NULL,
    tanggal_transaksi DATE DEFAULT CURRENT_DATE,
    keterangan TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PINJAMAN TABLES
-- =====================================================

-- Pinjaman
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
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cicilan Pinjaman
CREATE TABLE IF NOT EXISTS cicilan_pinjaman (
    id SERIAL PRIMARY KEY,
    pinjaman_id INTEGER REFERENCES pinjaman(id) ON DELETE CASCADE,
    cicilan_ke INTEGER NOT NULL,
    jumlah_cicilan DECIMAL(15,2) NOT NULL,
    tanggal_bayar DATE DEFAULT CURRENT_DATE,
    denda DECIMAL(15,2) DEFAULT 0,
    keterangan TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. POS TRANSACTION TABLES
-- =====================================================

-- Transaksi POS
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
    keterangan TEXT,
    shift_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detail Transaksi POS
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

-- =====================================================
-- 6. ACCOUNTING TABLES
-- =====================================================

-- Jurnal Umum
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

-- Detail Jurnal
CREATE TABLE IF NOT EXISTS detail_jurnal (
    id SERIAL PRIMARY KEY,
    jurnal_id INTEGER REFERENCES jurnal_umum(id) ON DELETE CASCADE,
    kode_akun VARCHAR(20) NOT NULL,
    nama_akun VARCHAR(255) NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0,
    kredit DECIMAL(15,2) DEFAULT 0,
    keterangan TEXT
);

-- =====================================================
-- 7. SYSTEM TABLES
-- =====================================================

-- Tutup Kasir
CREATE TABLE IF NOT EXISTS tutup_kasir (
    id SERIAL PRIMARY KEY,
    tanggal DATE DEFAULT CURRENT_DATE,
    kasir VARCHAR(255) NOT NULL,
    total_penjualan DECIMAL(15,2) DEFAULT 0,
    total_tunai DECIMAL(15,2) DEFAULT 0,
    total_kredit DECIMAL(15,2) DEFAULT 0,
    kas_awal DECIMAL(15,2) DEFAULT 0,
    kas_akhir DECIMAL(15,2) DEFAULT 0,
    selisih DECIMAL(15,2) DEFAULT 0,
    keterangan TEXT,
    status VARCHAR(20) DEFAULT 'buka' CHECK (status IN ('buka', 'tutup')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pengajuan Modal
CREATE TABLE IF NOT EXISTS pengajuan_modal (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    jumlah_pengajuan DECIMAL(15,2) NOT NULL,
    tujuan_penggunaan TEXT NOT NULL,
    jaminan TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    tanggal_pengajuan DATE DEFAULT CURRENT_DATE,
    tanggal_keputusan DATE,
    catatan_admin TEXT,
    created_by VARCHAR(255),
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. INSERT DEFAULT DATA
-- =====================================================

-- Default Chart of Accounts
INSERT INTO chart_of_accounts (kode_akun, nama_akun, jenis_akun, level_akun) VALUES
('1000', 'ASET', 'ASET', 1),
('1100', 'Kas', 'ASET', 2),
('1110', 'Kas Tunai', 'ASET', 3),
('1120', 'Kas Bank', 'ASET', 3),
('1200', 'Piutang', 'ASET', 2),
('1210', 'Piutang Anggota', 'ASET', 3),
('1220', 'Piutang Lain-lain', 'ASET', 3),
('1300', 'Persediaan', 'ASET', 2),
('1310', 'Persediaan Barang Dagangan', 'ASET', 3),
('1400', 'Aset Tetap', 'ASET', 2),
('1410', 'Peralatan', 'ASET', 3),
('1420', 'Akumulasi Penyusutan Peralatan', 'ASET', 3),

('2000', 'KEWAJIBAN', 'KEWAJIBAN', 1),
('2100', 'Simpanan Anggota', 'KEWAJIBAN', 2),
('2110', 'Simpanan Pokok', 'KEWAJIBAN', 3),
('2120', 'Simpanan Wajib', 'KEWAJIBAN', 3),
('2130', 'Simpanan Sukarela', 'KEWAJIBAN', 3),
('2200', 'Hutang', 'KEWAJIBAN', 2),
('2210', 'Hutang Dagang', 'KEWAJIBAN', 3),
('2220', 'Hutang Lain-lain', 'KEWAJIBAN', 3),

('3000', 'MODAL', 'MODAL', 1),
('3100', 'Modal Koperasi', 'MODAL', 2),
('3110', 'Modal Dasar', 'MODAL', 3),
('3120', 'Cadangan', 'MODAL', 3),
('3130', 'SHU Tahun Berjalan', 'MODAL', 3),

('4000', 'PENDAPATAN', 'PENDAPATAN', 1),
('4100', 'Pendapatan Usaha', 'PENDAPATAN', 2),
('4110', 'Pendapatan Penjualan', 'PENDAPATAN', 3),
('4120', 'Pendapatan Jasa', 'PENDAPATAN', 3),
('4200', 'Pendapatan Lain-lain', 'PENDAPATAN', 2),
('4210', 'Pendapatan Bunga', 'PENDAPATAN', 3),

('5000', 'BEBAN', 'BEBAN', 1),
('5100', 'Beban Operasional', 'BEBAN', 2),
('5110', 'Beban Gaji', 'BEBAN', 3),
('5120', 'Beban Listrik', 'BEBAN', 3),
('5130', 'Beban Telepon', 'BEBAN', 3),
('5140', 'Beban Penyusutan', 'BEBAN', 3),
('5200', 'Beban Lain-lain', 'BEBAN', 2),
('5210', 'Beban Administrasi', 'BEBAN', 3)
ON CONFLICT (kode_akun) DO NOTHING;

-- Default Admin User (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES 
('admin@koperasi.com', '$2b$10$rQZ8qVqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Super Admin', 'super_admin'),
('kasir@koperasi.com', '$2b$10$rQZ8qVqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Kasir Utama', 'kasir')
ON CONFLICT (email) DO NOTHING;

-- Sample Anggota
INSERT INTO anggota (kode_anggota, nama, alamat, telepon, departemen) VALUES
('A001', 'John Doe', 'Jl. Merdeka No. 1', '081234567890', 'Keuangan'),
('A002', 'Jane Smith', 'Jl. Sudirman No. 2', '081234567891', 'Operasional'),
('A003', 'Bob Johnson', 'Jl. Thamrin No. 3', '081234567892', 'Marketing')
ON CONFLICT (kode_anggota) DO NOTHING;

-- Sample Master Barang
INSERT INTO master_barang (kode_barang, nama_barang, kategori, unit, harga_beli, harga_jual, stok_current) VALUES
('B001', 'Beras Premium 5kg', 'Sembako', 'karung', 45000, 50000, 100),
('B002', 'Minyak Goreng 1L', 'Sembako', 'botol', 12000, 15000, 50),
('B003', 'Gula Pasir 1kg', 'Sembako', 'kg', 8000, 10000, 75),
('B004', 'Teh Celup', 'Minuman', 'kotak', 3000, 4000, 200),
('B005', 'Kopi Sachet', 'Minuman', 'kotak', 8000, 10000, 150)
ON CONFLICT (kode_barang) DO NOTHING;

-- =====================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_anggota_kode ON anggota(kode_anggota);
CREATE INDEX IF NOT EXISTS idx_anggota_status ON anggota(status);
CREATE INDEX IF NOT EXISTS idx_anggota_nama ON anggota(nama);

CREATE INDEX IF NOT EXISTS idx_master_barang_kode ON master_barang(kode_barang);
CREATE INDEX IF NOT EXISTS idx_master_barang_nama ON master_barang(nama_barang);
CREATE INDEX IF NOT EXISTS idx_master_barang_kategori ON master_barang(kategori);

CREATE INDEX IF NOT EXISTS idx_transaksi_pos_tanggal ON transaksi_pos(tanggal_transaksi);
CREATE INDEX IF NOT EXISTS idx_transaksi_pos_kasir ON transaksi_pos(kasir);
CREATE INDEX IF NOT EXISTS idx_transaksi_pos_nomor ON transaksi_pos(nomor_transaksi);

CREATE INDEX IF NOT EXISTS idx_jurnal_tanggal ON jurnal_umum(tanggal);
CREATE INDEX IF NOT EXISTS idx_jurnal_nomor ON jurnal_umum(nomor_jurnal);

CREATE INDEX IF NOT EXISTS idx_simpanan_wajib_periode ON simpanan_wajib(periode);
CREATE INDEX IF NOT EXISTS idx_simpanan_wajib_anggota ON simpanan_wajib(anggota_id);

-- =====================================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpanan_pokok ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpanan_wajib ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpanan_sukarela ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicilan_pinjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_transaksi_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal_umum ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_jurnal ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutup_kasir ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengajuan_modal ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for authenticated users)
-- Note: Customize these policies based on your security requirements

CREATE POLICY "Allow all for authenticated users" ON users 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON anggota 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON master_barang 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON simpanan_pokok 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON simpanan_wajib 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON simpanan_sukarela 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON pinjaman 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON cicilan_pinjaman 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON transaksi_pos 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON detail_transaksi_pos 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON jurnal_umum 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON detail_jurnal 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON chart_of_accounts 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON tutup_kasir 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON pengajuan_modal 
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 11. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anggota_updated_at BEFORE UPDATE ON anggota 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_barang_updated_at BEFORE UPDATE ON master_barang 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    current_date TEXT;
    sequence_num INTEGER;
    transaction_num TEXT;
BEGIN
    current_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(nomor_transaksi FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM transaksi_pos
    WHERE nomor_transaksi LIKE 'TRX' || current_date || '%';
    
    transaction_num := 'TRX' || current_date || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN transaction_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP COMPLETED
-- =====================================================

-- Show summary
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables created: %', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    );
    RAISE NOTICE 'Default admin user: admin@koperasi.com';
    RAISE NOTICE 'Default kasir user: kasir@koperasi.com';
    RAISE NOTICE 'Default password: admin123 (CHANGE THIS!)';
    RAISE NOTICE '==============================================';
END $$;