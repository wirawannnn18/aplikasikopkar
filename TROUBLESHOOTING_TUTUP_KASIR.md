# Troubleshooting - Tutup Kasir

## Perbaikan yang Dilakukan

### 1. Masalah Parameter Inline di Modal
**Masalah**: Fungsi `hitungSelisih()` dan `prosesTutupKas()` menggunakan parameter inline di onclick yang menyebabkan error.

**Solusi**: 
- Menambahkan variabel global `tutupKasData` untuk menyimpan data
- Mengubah fungsi untuk tidak menggunakan parameter
- Data diambil dari variabel global

### 2. Validasi Data Buka Kas
**Masalah**: Parsing JSON bisa gagal jika data corrupt.

**Solusi**:
- Menambahkan try-catch saat parsing JSON
- Menampilkan error message yang jelas
- Console.error untuk debugging

### 3. Filter Transaksi Shift
**Masalah**: Transaksi tidak difilter dengan benar berdasarkan waktu.

**Solusi**:
- Menambahkan filter berdasarkan waktu buka DAN waktu tutup
- Memastikan hanya transaksi dalam shift yang dihitung

### 4. Modal Tidak Muncul
**Masalah**: Modal tutup kasir tidak muncul.

**Solusi**:
- Menambahkan pengecekan element modal sebelum show
- Menambahkan error handling jika modal tidak ditemukan
- Console.error untuk debugging

---

## Cara Testing

### Test 1: Buka Kas
1. Login sebagai kasir
2. Masuk ke Point of Sales
3. Masukkan modal awal (contoh: 500000)
4. Klik "Buka Kas"
5. **Expected**: Halaman POS muncul dengan info shift

### Test 2: Transaksi
1. Pilih barang
2. Tambah ke keranjang
3. Pilih metode pembayaran (Cash)
4. Klik "Bayar"
5. **Expected**: Transaksi berhasil, struk tercetak

### Test 3: Tutup Kasir
1. Klik tombol "Tutup Kasir" (kuning)
2. **Expected**: Modal tutup kasir muncul
3. Lihat ringkasan transaksi
4. **Expected**: Data sesuai dengan transaksi yang dilakukan

### Test 4: Hitung Selisih
1. Di modal tutup kasir, masukkan kas aktual
2. Klik "Hitung Selisih"
3. **Expected**: Selisih muncul dengan warna yang sesuai
   - Hijau = PAS
   - Kuning = LEBIH
   - Merah = KURANG

### Test 5: Proses Tutup Kas
1. Masukkan kas aktual
2. Tambahkan catatan (opsional)
3. Klik "Tutup & Print Laporan"
4. **Expected**: 
   - Laporan tercetak
   - Modal tertutup
   - Redirect ke halaman buka kas

### Test 6: Riwayat Tutup Kasir
1. Masuk ke menu "Riwayat Tutup Kasir"
2. **Expected**: Daftar shift yang sudah ditutup muncul
3. Klik "Detail" pada salah satu shift
4. **Expected**: Modal detail muncul
5. Klik "Print"
6. **Expected**: Laporan tercetak ulang

---

## Debugging

### Jika Modal Tidak Muncul

1. **Buka Console Browser** (F12)
2. Cari error message:
   - "Modal tutupKasModal tidak ditemukan!"
   - "Data buka kas tidak valid!"
   - "Tidak ada data buka kas!"

3. **Cek sessionStorage**:
   ```javascript
   console.log(sessionStorage.getItem('bukaKas'));
   ```
   - Harus ada data JSON dengan struktur:
     ```json
     {
       "id": "...",
       "kasir": "...",
       "modalAwal": 500000,
       "waktuBuka": "2024-...",
       "status": "buka"
     }
     ```

4. **Cek Bootstrap**:
   - Pastikan Bootstrap JS sudah loaded
   - Cek di console: `typeof bootstrap`
   - Harus return "object"

### Jika Selisih Tidak Muncul

1. **Cek Console**:
   ```javascript
   console.log(tutupKasData);
   ```
   - Harus ada data dengan expectedCash

2. **Cek Input**:
   - Pastikan input kasAktual terisi
   - Pastikan value adalah number

3. **Cek Element**:
   ```javascript
   console.log(document.getElementById('selisihInfo'));
   console.log(document.getElementById('selisihAlert'));
   console.log(document.getElementById('selisihAmount'));
   ```
   - Semua harus return element, bukan null

### Jika Transaksi Tidak Tercatat

1. **Cek localStorage**:
   ```javascript
   console.log(localStorage.getItem('penjualan'));
   ```
   - Harus ada array transaksi

2. **Cek Waktu**:
   ```javascript
   const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
   console.log('Waktu Buka:', new Date(bukaKas.waktuBuka));
   
   const penjualan = JSON.parse(localStorage.getItem('penjualan'));
   penjualan.forEach(p => {
     console.log('Transaksi:', new Date(p.tanggal));
   });
   ```
   - Waktu transaksi harus >= waktu buka

### Jika Laporan Tidak Tercetak

1. **Cek Pop-up Blocker**:
   - Browser mungkin memblokir window.open
   - Allow pop-up untuk localhost

2. **Cek Data**:
   ```javascript
   const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas'));
   console.log(riwayat);
   ```
   - Harus ada data shift yang sudah ditutup

3. **Cek Fungsi**:
   ```javascript
   console.log(typeof printLaporanTutupKas);
   ```
   - Harus return "function"

---

## Error Messages

### "Tidak ada data buka kas!"
**Penyebab**: sessionStorage.bukaKas tidak ada  
**Solusi**: Buka kas terlebih dahulu

### "Data buka kas tidak valid!"
**Penyebab**: JSON parsing error  
**Solusi**: 
1. Clear sessionStorage: `sessionStorage.clear()`
2. Refresh browser
3. Buka kas lagi

### "Data tutup kas tidak ditemukan!"
**Penyebab**: Variable tutupKasData null  
**Solusi**: 
1. Tutup modal
2. Klik "Tutup Kasir" lagi
3. Jika masih error, refresh browser

### "Masukkan kas aktual terlebih dahulu!"
**Penyebab**: Input kasAktual kosong  
**Solusi**: Masukkan jumlah kas fisik

### "Modal tutupKasModal tidak ditemukan!"
**Penyebab**: Element modal tidak ada di DOM  
**Solusi**: 
1. Refresh browser
2. Cek console untuk error lain
3. Pastikan Bootstrap loaded

---

## Reset Data (Jika Perlu)

### Reset Session (Buka Kas)
```javascript
sessionStorage.clear();
```

### Reset Riwayat Tutup Kasir
```javascript
localStorage.removeItem('riwayatTutupKas');
```

### Reset Semua Data
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## Checklist Sebelum Melaporkan Bug

- [ ] Sudah coba refresh browser
- [ ] Sudah cek console untuk error
- [ ] Sudah coba clear cache
- [ ] Sudah coba di browser lain
- [ ] Sudah cek sessionStorage dan localStorage
- [ ] Sudah coba reset data
- [ ] Sudah screenshot error message
- [ ] Sudah catat langkah-langkah reproduksi

---

## Kontak Support

Jika masalah masih berlanjut setelah troubleshooting:
1. Screenshot error di console
2. Screenshot halaman yang bermasalah
3. Catat langkah-langkah yang dilakukan
4. Hubungi administrator sistem

---

## Catatan Teknis

### Struktur Data Buka Kas (sessionStorage)
```json
{
  "id": "unique-id",
  "kasir": "Nama Kasir",
  "modalAwal": 500000,
  "waktuBuka": "2024-01-01T08:00:00.000Z",
  "status": "buka"
}
```

### Struktur Data Tutup Kas (localStorage)
```json
{
  "id": "unique-id",
  "shiftId": "shift-id",
  "kasir": "Nama Kasir",
  "waktuBuka": "2024-01-01T08:00:00.000Z",
  "waktuTutup": "2024-01-01T17:00:00.000Z",
  "modalAwal": 500000,
  "totalCash": 2000000,
  "totalBon": 500000,
  "totalPenjualan": 2500000,
  "jumlahTransaksi": 25,
  "kasSeharusnya": 2500000,
  "kasAktual": 2500000,
  "selisih": 0,
  "catatan": "Shift normal"
}
```

### Variabel Global
- `cart`: Array keranjang belanja
- `modalKasir`: Number modal awal
- `shiftKasir`: Object data shift (deprecated, gunakan sessionStorage)
- `tutupKasData`: Object data untuk tutup kasir

---

## Update Log

**v1.1 - Perbaikan Tutup Kasir**
- ✅ Fixed parameter inline di modal
- ✅ Added validation untuk data buka kas
- ✅ Improved filter transaksi shift
- ✅ Added error handling untuk modal
- ✅ Added console.error untuk debugging
- ✅ Improved data structure

**v1.0 - Initial Release**
- ✅ Fitur buka kas
- ✅ Fitur tutup kasir
- ✅ Laporan tutup kasir
- ✅ Riwayat tutup kasir
