# Panduan Fitur Filter dan Hapus Jurnal

## Deskripsi
Fitur ini memungkinkan pengguna untuk memfilter data jurnal berdasarkan tanggal dan menghapus entri jurnal dengan aman, termasuk reversal otomatis dan audit trail lengkap.

## Fitur Utama

### 1. Filter Tanggal
- **Filter berdasarkan rentang tanggal**: Pilih tanggal awal dan akhir untuk menampilkan jurnal dalam periode tertentu
- **Preset periode**: Gunakan tombol preset untuk filter cepat:
  - Hari Ini
  - Minggu Ini
  - Bulan Ini
  - Bulan Lalu
- **Persistensi filter**: Filter tersimpan selama sesi dan akan dipulihkan saat kembali ke menu jurnal
- **Clear filter**: Hapus filter untuk menampilkan semua jurnal

### 2. Hapus Jurnal
- **Tombol hapus per entri**: Setiap jurnal memiliki tombol hapus (hanya untuk super admin)
- **Dialog konfirmasi**: Menampilkan detail lengkap jurnal sebelum dihapus
- **Alasan penghapusan**: Wajib mengisi alasan penghapusan untuk audit trail
- **Reversal otomatis**: Sistem otomatis membuat reversal entries untuk menjaga keseimbangan akuntansi
- **Update saldo COA**: Saldo akun otomatis disesuaikan saat jurnal dihapus
- **Audit logging**: Semua penghapusan tercatat dalam audit log dengan detail lengkap

## Cara Menggunakan

### Filter Jurnal

1. **Buka Menu Jurnal**
   - Login sebagai user dengan akses ke menu jurnal
   - Klik menu "Jurnal" di sidebar

2. **Gunakan Filter Tanggal**
   - Pilih tanggal awal dan akhir di form filter
   - Atau klik salah satu tombol preset (Hari Ini, Minggu Ini, dll)
   - Klik tombol "Terapkan Filter"
   - Jurnal akan ditampilkan sesuai rentang tanggal yang dipilih

3. **Clear Filter**
   - Klik tombol "Clear Filter" untuk menampilkan semua jurnal

### Hapus Jurnal

1. **Akses Fitur Hapus**
   - Login sebagai **Super Admin** (hanya super admin yang dapat menghapus jurnal)
   - Buka menu Jurnal
   - Lihat tombol hapus (ikon tempat sampah) di kolom Aksi

2. **Hapus Jurnal**
   - Klik tombol hapus pada jurnal yang ingin dihapus
   - Dialog konfirmasi akan muncul dengan detail jurnal:
     - Tanggal
     - Keterangan
     - Akun yang terlibat
     - Jumlah debit dan kredit
     - Dampak terhadap saldo akun

3. **Isi Alasan Penghapusan**
   - Masukkan alasan penghapusan di textarea (wajib diisi)
   - Alasan ini akan tersimpan di audit log

4. **Konfirmasi Penghapusan**
   - Klik tombol "Hapus" untuk mengkonfirmasi
   - Atau klik "Batal" untuk membatalkan

5. **Verifikasi Hasil**
   - Jurnal akan terhapus dari daftar
   - Saldo COA akan ter-update otomatis
   - Notifikasi sukses akan ditampilkan
   - Audit log akan mencatat penghapusan

## Validasi dan Keamanan

### Validasi Otomatis
- **Periode tertutup**: Jurnal dari periode yang sudah ditutup tidak dapat dihapus (kecuali super admin dengan konfirmasi tambahan)
- **Jurnal terekonsiliasi**: Jurnal yang sudah direkonsiliasi tidak dapat dihapus
- **Referensi transaksi**: Jurnal yang memiliki referensi ke transaksi lain tidak dapat dihapus
- **Alasan wajib**: Alasan penghapusan harus diisi (minimal 1 karakter, maksimal 500 karakter)

### Hak Akses
- **Filter**: Semua user dengan akses menu jurnal dapat menggunakan filter
- **Hapus**: Hanya super admin yang dapat menghapus jurnal

### Audit Trail
Setiap penghapusan jurnal akan tercatat dalam audit log dengan informasi:
- Timestamp penghapusan
- User yang menghapus (ID, nama, role)
- Detail jurnal yang dihapus
- Alasan penghapusan
- Dampak terhadap saldo akun
- Reversal entries yang dibuat
- Priority level (normal/high untuk periode tertutup)

## Reversal Otomatis

Saat jurnal dihapus, sistem akan:
1. Membuat reversal entries (membalik debit/kredit)
2. Menyesuaikan saldo COA dengan reversal
3. Mencatat reversal di audit log
4. Memastikan keseimbangan akuntansi tetap terjaga

### Contoh Reversal

**Jurnal Original:**
- Kas (Debit): Rp 1.000.000
- Pendapatan (Kredit): Rp 1.000.000

**Reversal (otomatis):**
- Kas dikurangi: Rp 1.000.000
- Pendapatan dikurangi: Rp 1.000.000

## Testing

### Test Manual
1. Buka file `test_hapus_jurnal_filter.html`
2. Klik "Setup Test Data" untuk membuat data test
3. Klik "Buka Aplikasi"
4. Login sebagai super admin (superadmin/super123)
5. Test filter tanggal
6. Test hapus jurnal
7. Verifikasi hasil di "Show Current Data"

### Test Otomatis
Jalankan property-based tests:
```bash
npm test -- __tests__/filterHapusJurnal.test.js
```

## Troubleshooting

### Filter tidak berfungsi
- Pastikan tanggal awal <= tanggal akhir
- Periksa format tanggal (harus valid)
- Clear browser cache jika filter tidak tersimpan

### Tidak bisa hapus jurnal
- Pastikan login sebagai super admin
- Periksa apakah jurnal dari periode tertutup
- Periksa apakah jurnal sudah direkonsiliasi
- Pastikan alasan penghapusan sudah diisi

### Saldo COA tidak sesuai
- Periksa audit log untuk melihat history penghapusan
- Verifikasi reversal entries sudah dibuat
- Hubungi administrator jika ada inkonsistensi

## Catatan Penting

⚠️ **PERHATIAN:**
- Penghapusan jurnal adalah operasi yang sensitif dan tidak dapat di-undo
- Selalu isi alasan penghapusan dengan jelas untuk audit trail
- Verifikasi detail jurnal sebelum menghapus
- Backup data secara berkala

## Support

Jika mengalami masalah atau memiliki pertanyaan, hubungi:
- Tim Development Koperasi Karyawan
- Email: support@koperasi.com
