# Aplikasi Koperasi Karyawan

Aplikasi koperasi terintegrasi dengan Point of Sales (POS) dan sistem keuangan untuk kebutuhan koperasi karyawan.

## Fitur Utama

### 1. Sistem Login & Hak Akses
- **Administrator**: Akses penuh ke semua fitur
- **Admin Keuangan**: Akses ke fitur keuangan dan simpan pinjam
- **Kasir**: Akses ke menu POS

### 2. Modul Koperasi
- Data koperasi dan modal awal
- Master anggota dengan kartu anggota
- Simpanan pokok, wajib, dan sukarela
- Buku tabungan anggota
- Pinjaman anggota
- Perhitungan SHU (Sisa Hasil Usaha)

### 3. Modul Keuangan
- Chart of Account (COA)
- Jurnal harian otomatis
- Laporan keuangan (Laba Rugi, Buku Besar)
- Laporan simpanan dan hutang piutang

### 4. Point of Sales (POS)
- Buka kas dengan modal harian
- Transaksi cash dan bon (kredit)
- Scan barcode atau pencarian manual
- Transaksi untuk anggota atau umum
- Cetak struk otomatis
- Tutup kasir harian

### 5. Manajemen Inventory
- Master barang dengan barcode
- Kategori dan satuan barang
- Data supplier
- Pembelian barang (langsung & PO)
- Stok opname
- Mutasi stok harian
- Laporan stok dengan HPP average

### 6. Laporan
- Laporan simpanan anggota
- Laporan hutang piutang
- Laporan laba rugi koperasi
- Laporan penjualan (cash & kredit)
- Laporan stok barang
- Laporan kas besar
- Export ke CSV

## Cara Menggunakan

1. Buka file `index.html` di browser
2. Login dengan kredensial default:
   - **Administrator**: username: `admin`, password: `admin123`
   - **Admin Keuangan**: username: `keuangan`, password: `keuangan123`
   - **Kasir**: username: `kasir`, password: `kasir123`

## Teknologi
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5
- LocalStorage untuk penyimpanan data

## Catatan
- Data disimpan di LocalStorage browser
- Backup data secara berkala dengan export
- Aplikasi berjalan offline setelah dimuat

## Struktur File
```
├── index.html          # Halaman utama
├── css/
│   └── style.css       # Styling aplikasi
├── js/
│   ├── app.js          # Core aplikasi
│   ├── auth.js         # Autentikasi & menu
│   ├── koperasi.js     # Modul koperasi
│   ├── pos.js          # Point of Sales
│   ├── inventory.js    # Manajemen barang
│   ├── keuangan.js     # Modul keuangan
│   └── reports.js      # Laporan
└── README.md           # Dokumentasi
```

## Pengembangan Selanjutnya
- Integrasi dengan backend server
- Database MySQL/PostgreSQL
- Multi-user real-time
- Notifikasi pembayaran
- Dashboard analytics
- Mobile app version
