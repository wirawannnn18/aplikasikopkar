# Quick Start: Input Saldo Awal Periode yang Balance

## Ringkasan Cepat

Untuk membuat saldo awal periode yang balance, ikuti 3 langkah ini:

### 1. Rumus Balance
```
ASET = KEWAJIBAN + MODAL

Dimana:
ASET = Kas + Bank + Pinjaman + Persediaan
KEWAJIBAN = Hutang + Simpanan Pokok + Simpanan Wajib + Simpanan Sukarela
MODAL = Modal Koperasi
```

### 2. Contoh Data Balance

```
ASET:
- Kas: Rp 10.000.000
- Bank: Rp 15.000.000
- Pinjaman Anggota: Rp 8.000.000
- Persediaan: Rp 7.700.000
Total = Rp 40.700.000

KEWAJIBAN:
- Hutang Supplier: Rp 5.000.000
- Simpanan Pokok: Rp 5.000.000 (5 anggota × Rp 1.000.000)
- Simpanan Wajib: Rp 2.500.000 (5 anggota × Rp 500.000)
- Simpanan Sukarela: Rp 5.000.000
Total = Rp 17.500.000

MODAL:
- Modal Koperasi: Rp 23.200.000

VALIDASI: Rp 40.700.000 = Rp 17.500.000 + Rp 23.200.000 ✅
```

### 3. Langkah Input

#### A. Import Data Anggota
File: `contoh_data_anggota_lengkap.csv`
- 5 anggota dengan data lengkap

#### B. Import Data Simpanan
1. **Simpanan Pokok**: `contoh_simpanan_pokok_balance.csv`
   - Total: Rp 5.000.000

2. **Simpanan Wajib**: `contoh_simpanan_wajib_balance.csv`
   - Total: Rp 2.500.000

3. **Simpanan Sukarela**: `contoh_simpanan_sukarela_balance.csv`
   - Total: Rp 5.000.000

#### C. Input Saldo Awal Periode
Buka menu **Saldo Awal Periode** → **Input Saldo Awal**

**Step 1 - Tanggal & Modal:**
- Tanggal: 2024-01-01
- Modal: Rp 23.200.000

**Step 2 - Kas & Bank:**
- Kas: Rp 10.000.000
- Bank: Rp 15.000.000

**Step 3 - Piutang:**
- Budi Santoso: Rp 5.000.000
- Ahmad Yani: Rp 3.000.000

**Step 4 - Hutang:**
- PT Sumber Pangan: Rp 3.000.000
- CV Mitra Jaya: Rp 2.000.000

**Step 5 - Persediaan:**
- Beras 5kg: 100 unit @ Rp 50.000 = Rp 5.000.000
- Minyak Goreng 2L: 50 unit @ Rp 30.000 = Rp 1.500.000
- Gula Pasir 1kg: 80 unit @ Rp 15.000 = Rp 1.200.000

**Step 6 - Simpanan:**
Sistem akan otomatis mengambil dari data simpanan yang sudah diimport

**Step 7 - Pinjaman & Ringkasan:**
- Budi Santoso: Rp 5.000.000, Bunga 12%, 12 bulan
- Ahmad Yani: Rp 3.000.000, Bunga 12%, 12 bulan
- Pastikan status **✓ Balance**
- Klik **Simpan**

## Cara Menghitung Modal Koperasi

Jika Anda sudah tahu total aset dan kewajiban:

```
Modal Koperasi = Total Aset - Total Kewajiban

Contoh:
Modal = Rp 40.700.000 - Rp 17.500.000
Modal = Rp 23.200.000
```

## Troubleshooting

### Tidak Balance?
1. Hitung ulang total simpanan
2. Pastikan semua data simpanan sudah diinput
3. Sesuaikan modal koperasi dengan rumus di atas

### Simpanan Tidak Muncul?
1. Import data simpanan terlebih dahulu
2. Refresh halaman saldo awal
3. Atau input manual di Step 6

## File Template

Gunakan file CSV yang sudah disediakan:
- `contoh_data_anggota_lengkap.csv`
- `contoh_simpanan_pokok_balance.csv`
- `contoh_simpanan_wajib_balance.csv`
- `contoh_simpanan_sukarela_balance.csv`

## Checklist

- [ ] Data anggota sudah diimport
- [ ] Data simpanan pokok sudah diimport
- [ ] Data simpanan wajib sudah diimport
- [ ] Data simpanan sukarela sudah diimport
- [ ] Modal koperasi sudah dihitung
- [ ] Saldo awal periode sudah diinput
- [ ] Status menunjukkan **✓ Balance**
- [ ] Data sudah disimpan

Selesai! Aplikasi siap digunakan dengan data yang balance.
