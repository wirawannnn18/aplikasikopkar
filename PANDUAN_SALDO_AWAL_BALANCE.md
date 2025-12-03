# Panduan Membuat Saldo Awal Periode yang Balance

## Pendahuluan

Dokumen ini menjelaskan cara membuat data saldo awal periode yang terintegrasi dengan data simpanan anggota (simpanan pokok, simpanan wajib, dan simpanan sukarela) agar perhitungan keuangan aplikasi koperasi balance sesuai dengan persamaan akuntansi:

**ASET = KEWAJIBAN + MODAL**

## Konsep Dasar Akuntansi Koperasi

### 1. Persamaan Akuntansi
```
ASET = KEWAJIBAN + MODAL

Dimana:
- ASET = Kas + Bank + Piutang + Persediaan + Pinjaman Anggota
- KEWAJIBAN = Hutang Supplier + Simpanan Pokok + Simpanan Wajib + Simpanan Sukarela
- MODAL = Modal Koperasi
```

### 2. Hubungan Simpanan dengan Kewajiban

Simpanan anggota adalah **KEWAJIBAN** koperasi karena:
- Simpanan Pokok: Dapat dikembalikan saat anggota keluar
- Simpanan Wajib: Dapat dikembalikan saat anggota keluar
- Simpanan Sukarela: Dapat ditarik sewaktu-waktu oleh anggota

## Langkah-Langkah Membuat Data Balance

### Langkah 1: Tentukan Modal Awal Koperasi

Modal awal adalah kekayaan bersih koperasi. Contoh:
```
Modal Koperasi = Rp 50.000.000
```

### Langkah 2: Tentukan Kas dan Bank

Uang tunai dan saldo bank yang dimiliki koperasi. Contoh:
```
Kas = Rp 10.000.000
Bank = Rp 15.000.000
Total Kas & Bank = Rp 25.000.000
```

### Langkah 3: Tentukan Simpanan Anggota

Simpanan anggota adalah kewajiban koperasi. Contoh untuk 5 anggota:

| NIK | Nama | Simpanan Pokok | Simpanan Wajib | Simpanan Sukarela | Total |
|-----|------|----------------|----------------|-------------------|-------|
| 3201010101010001 | Budi Santoso | Rp 1.000.000 | Rp 500.000 | Rp 2.000.000 | Rp 3.500.000 |
| 3201010101010002 | Siti Aminah | Rp 1.000.000 | Rp 500.000 | Rp 1.500.000 | Rp 3.000.000 |
| 3201010101010003 | Ahmad Yani | Rp 1.000.000 | Rp 500.000 | Rp 1.000.000 | Rp 2.500.000 |
| 3201010101010004 | Dewi Lestari | Rp 1.000.000 | Rp 500.000 | Rp 500.000 | Rp 2.000.000 |
| 3201010101010005 | Eko Prasetyo | Rp 1.000.000 | Rp 500.000 | Rp 0 | Rp 1.500.000 |

**Total Simpanan:**
```
Total Simpanan Pokok = Rp 5.000.000
Total Simpanan Wajib = Rp 2.500.000
Total Simpanan Sukarela = Rp 5.000.000
Total Kewajiban Simpanan = Rp 12.500.000
```

### Langkah 4: Tentukan Pinjaman Anggota (Piutang)

Pinjaman yang diberikan kepada anggota adalah aset (piutang). Contoh:

| Anggota | Jumlah Pokok | Bunga | Tenor | Status |
|---------|--------------|-------|-------|--------|
| Budi Santoso | Rp 5.000.000 | 12% | 12 bulan | Aktif |
| Ahmad Yani | Rp 3.000.000 | 12% | 12 bulan | Aktif |

```
Total Pinjaman Anggota = Rp 8.000.000
```

### Langkah 5: Tentukan Persediaan Barang

Nilai barang dagangan yang tersedia. Contoh:

| Nama Barang | HPP | Stok | Total Nilai |
|-------------|-----|------|-------------|
| Beras 5kg | Rp 50.000 | 100 | Rp 5.000.000 |
| Minyak Goreng 2L | Rp 30.000 | 50 | Rp 1.500.000 |
| Gula Pasir 1kg | Rp 15.000 | 80 | Rp 1.200.000 |

```
Total Persediaan = Rp 7.700.000
```

### Langkah 6: Tentukan Hutang Supplier

Hutang kepada supplier adalah kewajiban. Contoh:

| Supplier | Jumlah Hutang |
|----------|---------------|
| PT Sumber Pangan | Rp 3.000.000 |
| CV Mitra Jaya | Rp 2.000.000 |

```
Total Hutang Supplier = Rp 5.000.000
```

### Langkah 7: Hitung dan Validasi Balance

#### Hitung Total Aset:
```
Kas                    = Rp 10.000.000
Bank                   = Rp 15.000.000
Pinjaman Anggota       = Rp  8.000.000
Persediaan             = Rp  7.700.000
--------------------------------
TOTAL ASET             = Rp 40.700.000
```

#### Hitung Total Kewajiban:
```
Hutang Supplier        = Rp  5.000.000
Simpanan Pokok         = Rp  5.000.000
Simpanan Wajib         = Rp  2.500.000
Simpanan Sukarela      = Rp  5.000.000
--------------------------------
TOTAL KEWAJIBAN        = Rp 17.500.000
```

#### Hitung Total Modal:
```
Modal Koperasi         = Rp 50.000.000
```

#### Validasi Balance:
```
ASET = KEWAJIBAN + MODAL
Rp 40.700.000 ≠ Rp 17.500.000 + Rp 50.000.000
Rp 40.700.000 ≠ Rp 67.500.000

❌ TIDAK BALANCE!
Selisih = Rp 26.800.000
```

### Langkah 8: Koreksi agar Balance

Karena tidak balance, kita perlu menyesuaikan. Ada beberapa opsi:

#### Opsi A: Sesuaikan Modal Koperasi
```
Modal Koperasi yang benar = ASET - KEWAJIBAN
Modal Koperasi = Rp 40.700.000 - Rp 17.500.000
Modal Koperasi = Rp 23.200.000
```

#### Opsi B: Tambah Aset (Kas/Bank)
```
Kekurangan Aset = Rp 67.500.000 - Rp 40.700.000
Kekurangan = Rp 26.800.000

Tambahkan ke Kas atau Bank:
Kas = Rp 10.000.000 + Rp 26.800.000 = Rp 36.800.000
```

## Contoh Data Balance yang Benar

### Skenario 1: Modal Kecil, Kas Besar

```
ASET:
- Kas: Rp 30.000.000
- Bank: Rp 15.000.000
- Pinjaman Anggota: Rp 8.000.000
- Persediaan: Rp 7.700.000
Total Aset = Rp 60.700.000

KEWAJIBAN:
- Hutang Supplier: Rp 5.000.000
- Simpanan Pokok: Rp 5.000.000
- Simpanan Wajib: Rp 2.500.000
- Simpanan Sukarela: Rp 5.000.000
Total Kewajiban = Rp 17.500.000

MODAL:
- Modal Koperasi: Rp 43.200.000

VALIDASI:
Rp 60.700.000 = Rp 17.500.000 + Rp 43.200.000 ✅ BALANCE!
```

### Skenario 2: Modal Besar, Kas Kecil

```
ASET:
- Kas: Rp 10.000.000
- Bank: Rp 15.000.000
- Pinjaman Anggota: Rp 8.000.000
- Persediaan: Rp 7.700.000
Total Aset = Rp 40.700.000

KEWAJIBAN:
- Hutang Supplier: Rp 5.000.000
- Simpanan Pokok: Rp 5.000.000
- Simpanan Wajib: Rp 2.500.000
- Simpanan Sukarela: Rp 5.000.000
Total Kewajiban = Rp 17.500.000

MODAL:
- Modal Koperasi: Rp 23.200.000

VALIDASI:
Rp 40.700.000 = Rp 17.500.000 + Rp 23.200.000 ✅ BALANCE!
```

## Template Data untuk Input

### 1. Data Anggota (5 anggota)

```csv
NIK,Nama,No Kartu,Departemen,Tipe Anggota,Status,Telepon,Email,Alamat,Tanggal Daftar
3201010101010001,Budi Santoso,K001,Produksi,Anggota,Aktif,081234567801,budi@email.com,Jl. Merdeka No. 1,2024-01-01
3201010101010002,Siti Aminah,K002,Keuangan,Anggota,Aktif,081234567802,siti@email.com,Jl. Merdeka No. 2,2024-01-01
3201010101010003,Ahmad Yani,K003,Pemasaran,Anggota,Aktif,081234567803,ahmad@email.com,Jl. Merdeka No. 3,2024-01-01
3201010101010004,Dewi Lestari,K004,Administrasi,Anggota,Aktif,081234567804,dewi@email.com,Jl. Merdeka No. 4,2024-01-01
3201010101010005,Eko Prasetyo,K005,Produksi,Anggota,Aktif,081234567805,eko@email.com,Jl. Merdeka No. 5,2024-01-01
```

### 2. Data Simpanan Pokok

```csv
NIK,Nama,Jumlah,Tanggal
3201010101010001,Budi Santoso,1000000,2024-01-01
3201010101010002,Siti Aminah,1000000,2024-01-01
3201010101010003,Ahmad Yani,1000000,2024-01-01
3201010101010004,Dewi Lestari,1000000,2024-01-01
3201010101010005,Eko Prasetyo,1000000,2024-01-01
```

### 3. Data Simpanan Wajib

```csv
NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,500000,2024-01,2024-01-15
3201010101010002,Siti Aminah,500000,2024-01,2024-01-15
3201010101010003,Ahmad Yani,500000,2024-01,2024-01-15
3201010101010004,Dewi Lestari,500000,2024-01,2024-01-15
3201010101010005,Eko Prasetyo,500000,2024-01,2024-01-15
```

### 4. Data Simpanan Sukarela

```csv
NIK,Nama,Jumlah,Tanggal
3201010101010001,Budi Santoso,2000000,2024-01-01
3201010101010002,Siti Aminah,1500000,2024-01-01
3201010101010003,Ahmad Yani,1000000,2024-01-01
3201010101010004,Dewi Lestari,500000,2024-01-01
3201010101010005,Eko Prasetyo,0,2024-01-01
```

## Cara Input di Aplikasi

### 1. Input Data Anggota
1. Buka menu **Master Anggota**
2. Klik **Upload Data CSV/Excel**
3. Upload file data anggota atau paste data
4. Proses import

### 2. Input Data Simpanan
1. Buka menu **Simpanan**
2. Untuk setiap jenis simpanan (Pokok, Wajib, Sukarela):
   - Klik **Upload Data CSV/Excel**
   - Upload file atau paste data
   - Proses import

### 3. Input Saldo Awal Periode
1. Buka menu **Saldo Awal Periode**
2. Klik **Input Saldo Awal Periode**
3. Ikuti wizard 7 langkah:

#### Step 1: Tanggal & Modal
- Tanggal Mulai Periode: 2024-01-01
- Modal Awal Koperasi: Rp 23.200.000

#### Step 2: Kas & Bank
- Saldo Kas: Rp 10.000.000
- Saldo Bank: Rp 15.000.000

#### Step 3: Piutang Anggota
- Tambah piutang untuk anggota yang memiliki pinjaman
- Budi Santoso: Rp 5.000.000
- Ahmad Yani: Rp 3.000.000

#### Step 4: Hutang Supplier
- PT Sumber Pangan: Rp 3.000.000
- CV Mitra Jaya: Rp 2.000.000

#### Step 5: Persediaan
- Input stok awal untuk setiap barang
- Beras 5kg: 100 unit @ Rp 50.000
- Minyak Goreng 2L: 50 unit @ Rp 30.000
- Gula Pasir 1kg: 80 unit @ Rp 15.000

#### Step 6: Simpanan Anggota
- Sistem akan otomatis mengambil data dari simpanan yang sudah diinput
- Atau input manual per anggota:
  - Budi Santoso: Pokok Rp 1.000.000, Wajib Rp 500.000, Sukarela Rp 2.000.000
  - Siti Aminah: Pokok Rp 1.000.000, Wajib Rp 500.000, Sukarela Rp 1.500.000
  - Ahmad Yani: Pokok Rp 1.000.000, Wajib Rp 500.000, Sukarela Rp 1.000.000
  - Dewi Lestari: Pokok Rp 1.000.000, Wajib Rp 500.000, Sukarela Rp 500.000
  - Eko Prasetyo: Pokok Rp 1.000.000, Wajib Rp 500.000, Sukarela Rp 0

#### Step 7: Pinjaman & Ringkasan
- Tambah pinjaman aktif:
  - Budi Santoso: Pokok Rp 5.000.000, Bunga 12%, Tenor 12 bulan
  - Ahmad Yani: Pokok Rp 3.000.000, Bunga 12%, Tenor 12 bulan
- Lihat ringkasan dan pastikan **BALANCE** ✅
- Klik **Simpan**

## Checklist Validasi

Sebelum menyimpan saldo awal, pastikan:

- [ ] Total Aset = Total Kewajiban + Total Modal
- [ ] Total Simpanan Pokok sesuai dengan data simpanan pokok yang diinput
- [ ] Total Simpanan Wajib sesuai dengan data simpanan wajib yang diinput
- [ ] Total Simpanan Sukarela sesuai dengan data simpanan sukarela yang diinput
- [ ] Total Pinjaman Anggota sesuai dengan data pinjaman yang diinput
- [ ] Tidak ada selisih (atau selisih < Rp 1)
- [ ] Status menunjukkan "✓ Balance"

## Tips Penting

1. **Input Simpanan Dulu**: Selalu input data simpanan anggota sebelum input saldo awal periode
2. **Hitung Manual**: Hitung total simpanan secara manual untuk validasi
3. **Sesuaikan Modal**: Jika tidak balance, sesuaikan modal koperasi agar balance
4. **Backup Data**: Selalu backup data sebelum input saldo awal
5. **Cek Laporan**: Setelah input, cek laporan neraca untuk memastikan balance

## Troubleshooting

### Masalah: Tidak Balance

**Solusi:**
1. Hitung ulang total aset, kewajiban, dan modal
2. Periksa apakah ada data yang terlewat
3. Sesuaikan modal koperasi: Modal = Aset - Kewajiban

### Masalah: Simpanan Tidak Muncul

**Solusi:**
1. Pastikan data simpanan sudah diinput di menu Simpanan
2. Refresh halaman saldo awal
3. Input manual jika perlu

### Masalah: Selisih Kecil (< Rp 100)

**Solusi:**
- Selisih kecil biasanya karena pembulatan
- Sesuaikan salah satu nilai (biasanya kas) untuk menghilangkan selisih

## Contoh Kasus Lengkap

Berikut contoh lengkap data yang balance:

```
ASET:
├── Kas: Rp 10.000.000
├── Bank: Rp 15.000.000
├── Piutang Pinjaman: Rp 8.000.000
└── Persediaan: Rp 7.700.000
TOTAL ASET = Rp 40.700.000

KEWAJIBAN:
├── Hutang Supplier: Rp 5.000.000
├── Simpanan Pokok: Rp 5.000.000
├── Simpanan Wajib: Rp 2.500.000
└── Simpanan Sukarela: Rp 5.000.000
TOTAL KEWAJIBAN = Rp 17.500.000

MODAL:
└── Modal Koperasi: Rp 23.200.000

VALIDASI:
Rp 40.700.000 = Rp 17.500.000 + Rp 23.200.000 ✅
```

## Kesimpulan

Untuk membuat saldo awal periode yang balance:

1. Input data anggota terlebih dahulu
2. Input data simpanan (pokok, wajib, sukarela)
3. Hitung total simpanan = total kewajiban simpanan
4. Tentukan aset lainnya (kas, bank, persediaan, pinjaman)
5. Hitung total aset
6. Hitung modal koperasi = Total Aset - Total Kewajiban
7. Input saldo awal periode dengan data yang sudah dihitung
8. Validasi balance sebelum menyimpan

Dengan mengikuti panduan ini, data saldo awal periode akan balance dan terintegrasi dengan baik dengan data simpanan anggota.
