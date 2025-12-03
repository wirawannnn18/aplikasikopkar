# Alur Kas dan Akuntansi Sistem Koperasi

## Ringkasan Perubahan
Sistem telah diupdate untuk mencatat semua transaksi keuangan dengan benar menggunakan jurnal akuntansi double-entry.

## Chart of Account (COA)

### Aset (1-xxxx)
- **1-1000**: Kas - Uang tunai koperasi
- **1-1100**: Bank - Saldo bank
- **1-1200**: Piutang Anggota - Tagihan bon/kredit
- **1-1300**: Persediaan Barang - Nilai stok barang

### Kewajiban (2-xxxx)
- **2-1000**: Hutang Supplier
- **2-1100**: Simpanan Pokok
- **2-1200**: Simpanan Wajib
- **2-1300**: Simpanan Sukarela

### Modal (3-xxxx)
- **3-1000**: Modal Koperasi - Modal awal
- **3-2000**: Laba Ditahan

### Pendapatan (4-xxxx)
- **4-1000**: Pendapatan Penjualan
- **4-2000**: Pendapatan Bunga Pinjaman

### Beban (5-xxxx)
- **5-1000**: Harga Pokok Penjualan (HPP)
- **5-2000**: Beban Operasional

## Alur Transaksi

### 1. Modal Awal Koperasi
**Saat input/perubahan modal awal:**
```
Debit: Kas (1-1000)
Kredit: Modal Koperasi (3-1000)
```
**Penjelasan**: Kas bertambah, Modal bertambah

---

### 2. Pembelian Barang
**Saat pembelian barang dari supplier:**
```
Debit: Persediaan Barang (1-1300)
Kredit: Kas (1-1000)
```
**Penjelasan**: 
- Persediaan barang bertambah (aset)
- Kas berkurang (keluar uang)
- Stok barang otomatis bertambah

---

### 3. Penjualan Barang

#### A. Penjualan Cash
**Jurnal Pendapatan:**
```
Debit: Kas (1-1000)
Kredit: Pendapatan Penjualan (4-1000)
```

**Jurnal HPP:**
```
Debit: Harga Pokok Penjualan (5-1000)
Kredit: Persediaan Barang (1-1300)
```

**Penjelasan**:
- Kas bertambah (terima uang)
- Pendapatan bertambah
- HPP dicatat sebagai beban
- Persediaan berkurang

#### B. Penjualan Bon/Kredit
**Jurnal Pendapatan:**
```
Debit: Piutang Anggota (1-1200)
Kredit: Pendapatan Penjualan (4-1000)
```

**Jurnal HPP:**
```
Debit: Harga Pokok Penjualan (5-1000)
Kredit: Persediaan Barang (1-1300)
```

**Penjelasan**:
- Piutang bertambah (tagihan ke anggota)
- Pendapatan bertambah
- HPP dicatat sebagai beban
- Persediaan berkurang

---

### 4. Simpanan Anggota

#### Simpanan Pokok
```
Debit: Kas (1-1000)
Kredit: Simpanan Pokok (2-1100)
```

#### Simpanan Wajib
```
Debit: Kas (1-1000)
Kredit: Simpanan Wajib (2-1200)
```

#### Simpanan Sukarela (Setoran)
```
Debit: Kas (1-1000)
Kredit: Simpanan Sukarela (2-1300)
```

#### Simpanan Sukarela (Penarikan)
```
Debit: Simpanan Sukarela (2-1300)
Kredit: Kas (1-1000)
```

---

## Laporan Keuangan

### Laporan Laba Rugi
Menampilkan:
- **Modal Awal Koperasi** (dari data koperasi)
- **Total Modal** (Modal Awal + Modal dari COA)
- **Pendapatan** (dari akun 4-xxxx)
- **Beban** (dari akun 5-xxxx)
- **Laba/Rugi Bersih** = Pendapatan - Beban
- **Total Modal Akhir** = Modal Awal + Total Modal + Laba/Rugi

### Laporan SHU (Sisa Hasil Usaha)
Menampilkan:
- **Modal Awal** dari data koperasi
- **Total Pendapatan** dari penjualan
- **Total Beban** dari pembelian
- **Laba Kotor** = Pendapatan - Beban
- **Pembagian SHU** per anggota koperasi berdasarkan partisipasi

### Buku Besar
Menampilkan semua transaksi per akun dengan:
- Tanggal
- Keterangan
- Debit
- Kredit
- Saldo berjalan

---

## Validasi Balance

Sistem menggunakan **double-entry bookkeeping**, sehingga:
```
Total Debit = Total Kredit (untuk setiap transaksi)
```

**Persamaan Akuntansi:**
```
Aset = Kewajiban + Modal
```

Atau:
```
Aset - Kewajiban - Modal = 0
```

---

## Catatan Penting

1. **Setiap transaksi** harus dicatat dengan jurnal double-entry
2. **Modal awal** harus diinput di menu Data Koperasi
3. **HPP** dihitung otomatis saat penjualan
4. **Stok barang** otomatis update saat pembelian/penjualan
5. **Laporan keuangan** akan balance jika semua transaksi dicatat dengan benar

---

## Fitur yang Sudah Terintegrasi

✅ Modal Awal Koperasi → Jurnal  
✅ Pembelian Barang → Jurnal + Update Stok  
✅ Penjualan Cash → Jurnal (Pendapatan + HPP) + Update Stok  
✅ Penjualan Bon → Jurnal (Pendapatan + HPP) + Update Stok  
✅ Simpanan Pokok → Jurnal  
✅ Simpanan Wajib → Jurnal  
✅ Simpanan Sukarela → Jurnal  
✅ Laporan Laba Rugi → Menampilkan Modal Awal  
✅ Laporan SHU → Menampilkan Modal Awal  

---

## Testing

Untuk memastikan sistem balance:

1. Input modal awal di **Data Koperasi**
2. Lakukan beberapa transaksi:
   - Pembelian barang
   - Penjualan cash
   - Penjualan bon
   - Simpanan anggota
3. Cek **Laporan → Buku Besar** untuk melihat semua jurnal
4. Cek **Laporan → Laba Rugi Koperasi** untuk melihat balance
5. Verifikasi: Total Debit = Total Kredit di setiap jurnal
