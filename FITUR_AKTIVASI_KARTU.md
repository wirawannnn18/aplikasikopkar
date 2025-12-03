# Fitur Aktivasi Kartu Anggota

## Deskripsi

Fitur ini memungkinkan administrator untuk mengelola status kartu anggota koperasi. Setiap kartu anggota dapat memiliki status: **Aktif**, **Nonaktif**, atau **Diblokir**.

---

## Status Kartu

### 1. Aktif ✅
- Kartu dapat digunakan untuk semua transaksi
- Anggota dapat berbelanja di POS
- Anggota dapat melakukan simpan pinjam
- Status normal untuk anggota aktif

### 2. Nonaktif ⚠️
- Kartu tidak dapat digunakan sementara
- Transaksi ditolak
- Dapat diaktifkan kembali kapan saja
- Untuk anggota cuti atau suspend sementara

### 3. Diblokir 🚫
- Kartu diblokir permanen
- Untuk kartu hilang, rusak, atau anggota bermasalah
- Memerlukan penerbitan kartu baru
- Tidak dapat digunakan untuk transaksi

---

## Fitur Utama

### 1. Dashboard Status Kartu
Menampilkan ringkasan:
- Jumlah kartu aktif (hijau)
- Jumlah kartu nonaktif (kuning)
- Jumlah kartu diblokir (merah)

### 2. Tab Filter
- **Semua**: Menampilkan semua anggota
- **Aktif**: Hanya kartu aktif
- **Nonaktif**: Hanya kartu nonaktif
- **Blokir**: Hanya kartu diblokir

### 3. Kelola Kartu
Untuk setiap anggota:
- Lihat status kartu saat ini
- Ubah status kartu
- Tambahkan catatan perubahan
- Lihat riwayat perubahan

### 4. Riwayat Perubahan
Setiap perubahan status dicatat:
- Tanggal perubahan
- Status lama → Status baru
- Catatan/alasan
- Diubah oleh siapa

---

## Cara Penggunaan

### Mengaktifkan Kartu

1. **Masuk ke Menu**
   - Login sebagai Administrator
   - Klik menu "Aktivasi Kartu"

2. **Pilih Anggota**
   - Lihat daftar anggota
   - Klik tombol "Kelola" pada anggota yang diinginkan

3. **Ubah Status**
   - Modal akan muncul menampilkan info anggota
   - Lihat status kartu saat ini
   - Masukkan catatan (opsional)
   - Klik tombol "Aktifkan"

4. **Konfirmasi**
   - Sistem akan meminta konfirmasi
   - Klik "OK" untuk melanjutkan
   - Kartu berhasil diaktifkan

### Menonaktifkan Kartu

1. **Pilih Anggota**
   - Klik tombol "Kelola" pada anggota

2. **Nonaktifkan**
   - Masukkan alasan (contoh: "Cuti panjang")
   - Klik tombol "Nonaktifkan"
   - Konfirmasi perubahan

3. **Hasil**
   - Kartu tidak dapat digunakan
   - Status berubah menjadi "Nonaktif"
   - Riwayat tercatat

### Memblokir Kartu

1. **Pilih Anggota**
   - Klik tombol "Kelola" pada anggota

2. **Blokir**
   - Masukkan alasan (contoh: "Kartu hilang")
   - Klik tombol "Blokir"
   - Konfirmasi perubahan

3. **Hasil**
   - Kartu diblokir permanen
   - Status berubah menjadi "Diblokir"
   - Perlu penerbitan kartu baru

---

## Integrasi dengan Sistem

### 1. Point of Sales (POS)
```javascript
// Validasi status kartu saat transaksi
if (member.statusKartu !== 'aktif') {
    showAlert('Kartu tidak aktif! Tidak dapat melakukan transaksi.', 'error');
    return;
}
```

### 2. Simpanan
```javascript
// Cek status kartu sebelum simpan
if (member.statusKartu === 'blokir') {
    showAlert('Kartu diblokir! Hubungi administrator.', 'error');
    return;
}
```

### 3. Pinjaman
```javascript
// Validasi kartu aktif untuk pinjaman
if (member.statusKartu !== 'aktif') {
    showAlert('Hanya anggota dengan kartu aktif yang dapat mengajukan pinjaman.', 'error');
    return;
}
```

---

## Data Structure

### Anggota dengan Status Kartu
```javascript
{
    id: "unique-id",
    nik: "123456",
    nama: "John Doe",
    noKartu: "KTA001",
    statusKartu: "aktif", // aktif | nonaktif | blokir
    tanggalUbahKartu: "2024-01-01T10:00:00.000Z",
    catatanKartu: "Kartu diaktifkan",
    riwayatKartu: [
        {
            tanggal: "2024-01-01T10:00:00.000Z",
            statusLama: "nonaktif",
            statusBaru: "aktif",
            catatan: "Aktivasi kartu baru",
            oleh: "Administrator"
        }
    ]
}
```

---

## Skenario Penggunaan

### Skenario 1: Anggota Baru
```
1. Admin menambahkan anggota baru
2. Status kartu default: NONAKTIF
3. Admin aktivasi kartu melalui menu "Aktivasi Kartu"
4. Status berubah: AKTIF
5. Anggota dapat bertransaksi
```

### Skenario 2: Anggota Cuti
```
1. Anggota mengajukan cuti panjang
2. Admin nonaktifkan kartu
3. Catatan: "Cuti panjang 3 bulan"
4. Status: NONAKTIF
5. Setelah cuti selesai, admin aktifkan kembali
```

### Skenario 3: Kartu Hilang
```
1. Anggota lapor kartu hilang
2. Admin blokir kartu lama
3. Catatan: "Kartu hilang, perlu penerbitan baru"
4. Status: DIBLOKIR
5. Admin terbitkan kartu baru dengan nomor berbeda
```

### Skenario 4: Anggota Bermasalah
```
1. Anggota memiliki tunggakan besar
2. Admin blokir kartu sementara
3. Catatan: "Tunggakan belum dibayar"
4. Status: NONAKTIF
5. Setelah lunas, admin aktifkan kembali
```

---

## Keamanan

### 1. Hak Akses
- ✅ **Administrator**: Full access (aktifkan, nonaktifkan, blokir)
- ❌ **Keuangan**: Read only
- ❌ **Kasir**: Tidak ada akses

### 2. Audit Trail
- Semua perubahan tercatat
- Timestamp perubahan
- User yang melakukan perubahan
- Alasan perubahan

### 3. Validasi
- Konfirmasi sebelum perubahan status
- Catatan wajib untuk blokir
- Tidak bisa ubah status yang sama

---

## Laporan

### Laporan Status Kartu
```
Total Anggota: 100
- Kartu Aktif: 85 (85%)
- Kartu Nonaktif: 10 (10%)
- Kartu Diblokir: 5 (5%)
```

### Riwayat Aktivasi
```
Tanggal: 2024-01-01 10:00
Anggota: John Doe (KTA001)
Status: Nonaktif → Aktif
Catatan: Aktivasi kartu baru
Oleh: Administrator
```

---

## Troubleshooting

### Kartu Tidak Bisa Diaktifkan
**Penyebab**: Status anggota nonaktif  
**Solusi**: 
1. Cek status anggota di Master Anggota
2. Ubah status anggota menjadi "Aktif"
3. Kemudian aktifkan kartu

### Transaksi Ditolak Padahal Kartu Aktif
**Penyebab**: Cache browser  
**Solusi**:
1. Refresh halaman (F5)
2. Clear cache browser
3. Cek ulang status kartu

### Riwayat Tidak Muncul
**Penyebab**: Data lama sebelum fitur ini ada  
**Solusi**:
1. Riwayat hanya untuk perubahan setelah fitur ini aktif
2. Data lama tidak memiliki riwayat

---

## Best Practices

### ✅ DO (Lakukan)
- Selalu beri catatan saat mengubah status
- Aktifkan kartu setelah anggota baru terdaftar
- Blokir kartu yang hilang segera
- Review status kartu secara berkala
- Dokumentasikan alasan perubahan

### ❌ DON'T (Jangan)
- Jangan aktifkan kartu anggota bermasalah
- Jangan blokir tanpa alasan jelas
- Jangan lupa aktivasi kartu anggota baru
- Jangan ubah status tanpa konfirmasi
- Jangan abaikan laporan kartu hilang

---

## FAQ

**Q: Apakah kartu nonaktif bisa diaktifkan kembali?**  
A: Ya, kartu nonaktif dapat diaktifkan kembali kapan saja.

**Q: Apakah kartu diblokir bisa diaktifkan kembali?**  
A: Bisa, tapi sebaiknya terbitkan kartu baru dengan nomor berbeda.

**Q: Bagaimana jika anggota kehilangan kartu?**  
A: Blokir kartu lama, terbitkan kartu baru dengan nomor berbeda.

**Q: Apakah perubahan status tercatat?**  
A: Ya, semua perubahan tercatat dalam riwayat dengan timestamp dan user.

**Q: Siapa yang bisa mengubah status kartu?**  
A: Hanya Administrator yang memiliki akses untuk mengubah status kartu.

**Q: Apakah status kartu mempengaruhi transaksi?**  
A: Ya, hanya kartu dengan status "Aktif" yang dapat digunakan untuk transaksi.

---

## Update Log

**v1.5 - Fitur Aktivasi Kartu**
- ✅ Added menu Aktivasi Kartu
- ✅ Added status kartu (aktif, nonaktif, blokir)
- ✅ Added dashboard status kartu
- ✅ Added tab filter berdasarkan status
- ✅ Added modal kelola kartu
- ✅ Added riwayat perubahan status
- ✅ Added catatan perubahan
- ✅ Added validasi status saat transaksi
- ✅ Added audit trail
- ✅ Default status "nonaktif" untuk anggota baru

---

## Kesimpulan

Fitur Aktivasi Kartu memberikan kontrol penuh kepada administrator untuk mengelola status kartu anggota. Dengan fitur ini:

1. ✅ Keamanan transaksi lebih terjaga
2. ✅ Kartu hilang dapat diblokir segera
3. ✅ Anggota bermasalah dapat di-suspend
4. ✅ Riwayat perubahan tercatat dengan baik
5. ✅ Audit trail lengkap untuk compliance

Fitur ini penting untuk menjaga integritas sistem dan keamanan transaksi koperasi.
