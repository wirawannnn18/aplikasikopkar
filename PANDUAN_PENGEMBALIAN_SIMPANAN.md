# Panduan Lengkap: Proses Pengembalian Simpanan

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Logika Perhitungan](#logika-perhitungan)
3. [Metode Pembayaran](#metode-pembayaran)
4. [Proses Step-by-Step](#proses-step-by-step)
5. [Contoh Bukti Pengembalian](#contoh-bukti-pengembalian)
6. [Validasi dan Error Handling](#validasi-dan-error-handling)
7. [Integrasi Akuntansi](#integrasi-akuntansi)
8. [FAQ](#faq)

---

## Pengenalan

Proses pengembalian simpanan adalah tahap krusial dalam pengelolaan anggota keluar. Sistem akan menghitung secara otomatis total simpanan yang harus dikembalikan kepada anggota, dengan mempertimbangkan:

- Simpanan Pokok
- Simpanan Wajib
- Kewajiban yang belum diselesaikan

### Prinsip Pengembalian

1. **Transparansi**: Semua perhitungan ditampilkan dengan jelas
2. **Akurasi**: Sistem menghitung dari data transaksi historis
3. **Integritas**: Terintegrasi dengan sistem akuntansi
4. **Audit Trail**: Semua proses tercatat lengkap

---

## Logika Perhitungan

### Formula Dasar

```
Total Pengembalian = Simpanan Pokok + Simpanan Wajib - Kewajiban Lain
```

### Komponen Perhitungan

#### 1. Simpanan Pokok

**Definisi**: Dana yang disetor anggota saat pertama kali mendaftar

**Cara Perhitungan**:
```javascript
Total Simpanan Pokok = SUM(semua transaksi simpanan pokok anggota)
```

**Contoh**:
```
Transaksi 1: 01/01/2023 - Rp 500.000
Transaksi 2: 01/07/2023 - Rp 500.000
─────────────────────────────────────
Total:                    Rp 1.000.000
```

#### 2. Simpanan Wajib

**Definisi**: Dana yang disetor anggota secara berkala

**Cara Perhitungan**:
```javascript
Total Simpanan Wajib = SUM(semua transaksi simpanan wajib anggota)
```

**Contoh**:
```
Jan 2023: Rp 100.000
Feb 2023: Rp 100.000
Mar 2023: Rp 100.000
... (25 bulan)
─────────────────────
Total:    Rp 2.500.000
```

#### 3. Kewajiban Lain

**Definisi**: Hutang anggota yang belum diselesaikan

**Sumber Kewajiban**:
- Hutang pembelian kredit di POS
- Kewajiban lain yang tercatat

**Cara Perhitungan**:
```javascript
Total Kewajiban = Total Kredit POS - Total Pembayaran Hutang
```

**Contoh**:
```
Total Kredit POS:        Rp 500.000
Sudah Dibayar:           Rp 350.000
─────────────────────────────────────
Kewajiban Tersisa:       Rp 150.000
```

### Contoh Perhitungan Lengkap

**Kasus 1: Tidak Ada Kewajiban**
```
Simpanan Pokok:          Rp 1.000.000
Simpanan Wajib:          Rp 2.500.000
Kewajiban Lain:          Rp         0
─────────────────────────────────────
TOTAL PENGEMBALIAN:      Rp 3.500.000
```

**Kasus 2: Ada Kewajiban**
```
Simpanan Pokok:          Rp 1.000.000
Simpanan Wajib:          Rp 2.500.000
Kewajiban Lain:          Rp   150.000 (-)
─────────────────────────────────────
TOTAL PENGEMBALIAN:      Rp 3.350.000
```

**Kasus 3: Kewajiban Lebih Besar**
```
Simpanan Pokok:          Rp 1.000.000
Simpanan Wajib:          Rp 1.500.000
Kewajiban Lain:          Rp 3.000.000 (-)
─────────────────────────────────────
TOTAL PENGEMBALIAN:      Rp  -500.000
                         (Anggota masih berhutang)
```

### Aturan Khusus

1. **Jika Total Negatif**:
   - Sistem akan menampilkan peringatan
   - Pengembalian tidak dapat diproses
   - Anggota harus melunasi kewajiban terlebih dahulu

2. **Jika Total Nol**:
   - Pengembalian tetap dapat diproses
   - Bukti pengembalian tetap dibuat
   - Untuk keperluan administrasi

3. **Pembulatan**:
   - Semua perhitungan dalam Rupiah penuh
   - Tidak ada pembulatan otomatis

---

## Metode Pembayaran

### 1. Kas

**Kapan Digunakan**:
- Pembayaran tunai langsung
- Jumlah pengembalian relatif kecil
- Anggota mengambil langsung di kantor

**Proses**:
1. Pilih "Kas" sebagai metode pembayaran
2. Sistem akan mengurangi saldo Kas
3. Jurnal: Kredit Kas

**Validasi**:
- Saldo Kas harus mencukupi
- Jika tidak cukup, sistem akan menolak

**Contoh Jurnal**:
```
Tanggal: 05/12/2025
Keterangan: Pengembalian simpanan - Budi Santoso

Debit:  Simpanan Pokok Anggota    Rp 1.000.000
Debit:  Simpanan Wajib Anggota    Rp 2.500.000
Kredit: Kas                       Rp 3.500.000
```

### 2. Transfer Bank

**Kapan Digunakan**:
- Pembayaran non-tunai
- Jumlah pengembalian besar
- Anggota tidak bisa datang langsung

**Proses**:
1. Pilih "Transfer Bank" sebagai metode pembayaran
2. Sistem akan mengurangi saldo Bank
3. Jurnal: Kredit Bank
4. Lakukan transfer manual ke rekening anggota
5. Catat nomor referensi transfer

**Validasi**:
- Saldo Bank harus mencukupi
- Jika tidak cukup, sistem akan menolak

**Contoh Jurnal**:
```
Tanggal: 05/12/2025
Keterangan: Pengembalian simpanan - Budi Santoso

Debit:  Simpanan Pokok Anggota    Rp 1.000.000
Debit:  Simpanan Wajib Anggota    Rp 2.500.000
Kredit: Bank                      Rp 3.500.000
```

### Perbandingan Metode

| Aspek | Kas | Transfer Bank |
|-------|-----|---------------|
| Kecepatan | ⚡ Instant | 🕐 1-2 hari kerja |
| Limit | Terbatas saldo kas | Terbatas saldo bank |
| Bukti | Kwitansi fisik | Bukti transfer |
| Keamanan | Risiko fisik | Lebih aman |
| Biaya | Gratis | Mungkin ada biaya transfer |

---

## Proses Step-by-Step

### Persiapan

**Checklist Sebelum Memulai**:
- [ ] Anggota sudah ditandai dengan status "Keluar"
- [ ] Semua pinjaman sudah lunas
- [ ] Saldo kas/bank mencukupi
- [ ] Data anggota sudah diverifikasi

### Langkah 1: Buka Form Pengembalian

1. Dari halaman Master Anggota
2. Cari anggota dengan status "Keluar"
3. Klik tombol "Proses Pengembalian"

**Screenshot Lokasi**:
```
[Master Anggota]
┌────────────────────────────────────────────────────┐
│ NIK    │ Nama         │ Status  │ Aksi             │
├────────────────────────────────────────────────────┤
│ 123456 │ Budi Santoso │ Keluar  │ [Proses Pengemb] │
└────────────────────────────────────────────────────┘
```

### Langkah 2: Review Perhitungan

**Modal akan menampilkan**:

```
╔═══════════════════════════════════════════════════╗
║        DETAIL PENGEMBALIAN SIMPANAN               ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Anggota: Budi Santoso                           ║
║  NIK: 1234567890123456                           ║
║  Tanggal Keluar: 01/12/2025                      ║
║                                                   ║
║  ─────────────────────────────────────────────   ║
║                                                   ║
║  Simpanan Pokok:           Rp  1.000.000         ║
║  Simpanan Wajib:           Rp  2.500.000         ║
║  ─────────────────────────────────────────────   ║
║  Total Simpanan:           Rp  3.500.000         ║
║                                                   ║
║  Kewajiban Lain:           Rp    150.000 (-)     ║
║  ─────────────────────────────────────────────   ║
║                                                   ║
║  TOTAL PENGEMBALIAN:       Rp  3.350.000         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

**Verifikasi**:
- ✅ Cek apakah jumlah simpanan sudah benar
- ✅ Cek apakah ada kewajiban yang tercatat
- ✅ Cek total pengembalian

### Langkah 3: Isi Form Pembayaran

**Field yang Harus Diisi**:

1. **Metode Pembayaran** (Wajib)
   - Dropdown: Pilih "Kas" atau "Transfer Bank"
   - Default: Tidak ada (harus dipilih)

2. **Tanggal Pembayaran** (Wajib)
   - Date picker
   - Default: Tanggal hari ini
   - Bisa diubah sesuai kebutuhan

3. **Keterangan** (Opsional)
   - Text area
   - Maksimal 500 karakter
   - Contoh: "Pengembalian sesuai pengajuan tanggal 01/12/2025"

**Contoh Pengisian**:
```
Metode Pembayaran: [Kas ▼]
Tanggal Pembayaran: [05/12/2025 📅]
Keterangan: [Pengembalian sesuai pengajuan...]
```

### Langkah 4: Validasi Otomatis

Setelah mengisi form, sistem akan validasi:

**Validasi yang Dilakukan**:

1. ✅ **Cek Pinjaman Aktif**
   ```
   Query: SELECT * FROM pinjaman 
          WHERE anggotaId = ? AND status != 'lunas'
   
   Jika ada: ❌ Error
   Jika tidak: ✅ Lanjut
   ```

2. ✅ **Cek Saldo Kas/Bank**
   ```
   If metodePembayaran == "Kas":
       Cek: saldoKas >= totalPengembalian
   
   If metodePembayaran == "Transfer Bank":
       Cek: saldoBank >= totalPengembalian
   
   Jika cukup: ✅ Lanjut
   Jika tidak: ❌ Error
   ```

3. ✅ **Cek Metode Pembayaran**
   ```
   Jika null/empty: ❌ Error
   Jika bukan "Kas" atau "Transfer Bank": ❌ Error
   Jika valid: ✅ Lanjut
   ```

**Indikator Visual**:
- ✅ Hijau: Validasi berhasil
- ❌ Merah: Validasi gagal
- ⚠️ Kuning: Peringatan (bisa dilanjutkan)

### Langkah 5: Konfirmasi

**Dialog Konfirmasi**:
```
╔═══════════════════════════════════════════════════╗
║           KONFIRMASI PENGEMBALIAN                 ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Anda akan memproses pengembalian simpanan:      ║
║                                                   ║
║  Anggota: Budi Santoso                           ║
║  Total: Rp 3.350.000                             ║
║  Metode: Kas                                      ║
║                                                   ║
║  Proses ini tidak dapat dibatalkan setelah       ║
║  selesai. Lanjutkan?                             ║
║                                                   ║
║  [Batal]                    [Ya, Proses]         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

**Pertimbangan**:
- Pastikan semua data sudah benar
- Proses tidak dapat di-undo
- Jurnal akan langsung tercatat

### Langkah 6: Proses Berjalan

**Loading State**:
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║              ⏳ Memproses...                      ║
║                                                   ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  75%            ║
║                                                   ║
║  Membuat jurnal akuntansi...                     ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

**Proses Backend**:
1. Buat record pengembalian
2. Generate jurnal untuk simpanan pokok
3. Generate jurnal untuk simpanan wajib
4. Update saldo COA
5. Update status pengembalian
6. Buat audit log
7. Commit transaksi

**Durasi**: Biasanya 2-5 detik

### Langkah 7: Sukses

**Notifikasi Sukses**:
```
╔═══════════════════════════════════════════════════╗
║              ✅ BERHASIL!                         ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Pengembalian simpanan berhasil diproses         ║
║                                                   ║
║  Referensi: PGM-20251205-001                     ║
║  Total: Rp 3.350.000                             ║
║                                                   ║
║  [Cetak Bukti]                [Tutup]            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

**Hasil**:
- ✅ Status pengembalian: "Selesai"
- ✅ Saldo simpanan: Rp 0
- ✅ Jurnal tercatat
- ✅ Audit log tersimpan

### Langkah 8: Cetak Bukti

Klik tombol "Cetak Bukti" untuk membuka bukti pengembalian.

---

## Contoh Bukti Pengembalian

### Format Bukti

```
═══════════════════════════════════════════════════════════
                  KOPERASI KARYAWAN
                   Jl. Contoh No. 123
                  Telp: (021) 1234-5678
═══════════════════════════════════════════════════════════

              BUKTI PENGEMBALIAN SIMPANAN

Nomor Referensi: PGM-20251205-001
Tanggal: 05 Desember 2025

───────────────────────────────────────────────────────────

DATA ANGGOTA:
  NIK             : 1234567890123456
  Nama            : Budi Santoso
  Departemen      : IT
  Tanggal Keluar  : 01 Desember 2025
  Alasan Keluar   : Pindah ke kota lain

───────────────────────────────────────────────────────────

RINCIAN PENGEMBALIAN:

  Simpanan Pokok                        Rp  1.000.000
  Simpanan Wajib                        Rp  2.500.000
  ─────────────────────────────────────────────────────
  Total Simpanan                        Rp  3.500.000

  Kewajiban Lain                        Rp    150.000 (-)
  ─────────────────────────────────────────────────────

  TOTAL PENGEMBALIAN                    Rp  3.350.000

───────────────────────────────────────────────────────────

DETAIL PEMBAYARAN:
  Metode Pembayaran : Kas
  Tanggal Pembayaran: 05 Desember 2025
  Keterangan        : Pengembalian sesuai pengajuan

───────────────────────────────────────────────────────────

TANDA TANGAN:

Penerima,                    Bendahara,


_________________           _________________
(Budi Santoso)              (Nama Bendahara)


                Mengetahui,
                Ketua Koperasi,


                _________________
                (Nama Ketua)

───────────────────────────────────────────────────────────
Dokumen ini sah tanpa tanda tangan basah
Dicetak pada: 05 Desember 2025 14:30:15
═══════════════════════════════════════════════════════════
```

### Elemen Bukti

1. **Header Koperasi**
   - Nama koperasi
   - Alamat
   - Kontak

2. **Nomor Referensi**
   - Format: PGM-YYYYMMDD-XXX
   - Unik untuk setiap transaksi

3. **Data Anggota**
   - NIK
   - Nama lengkap
   - Departemen
   - Tanggal keluar
   - Alasan keluar

4. **Rincian Pengembalian**
   - Simpanan pokok
   - Simpanan wajib
   - Kewajiban (jika ada)
   - Total pengembalian

5. **Detail Pembayaran**
   - Metode pembayaran
   - Tanggal pembayaran
   - Keterangan

6. **Area Tanda Tangan**
   - Penerima (Anggota)
   - Pemberi (Bendahara)
   - Mengetahui (Ketua)

7. **Footer**
   - Timestamp cetak
   - Disclaimer

---

## Validasi dan Error Handling

### Error: Pinjaman Aktif

**Pesan Error**:
```
❌ Pengembalian Tidak Dapat Diproses

Anggota masih memiliki 2 pinjaman aktif dengan total:
Rp 5.000.000

Silakan lunasi semua pinjaman terlebih dahulu sebelum
memproses pengembalian simpanan.

Detail Pinjaman:
1. Pinjaman #001 - Rp 3.000.000 (Sisa: Rp 2.500.000)
2. Pinjaman #002 - Rp 2.500.000 (Sisa: Rp 2.500.000)
```

**Solusi**:
1. Buka menu Pinjaman
2. Proses pelunasan untuk setiap pinjaman
3. Kembali ke proses pengembalian

### Error: Saldo Tidak Cukup

**Pesan Error**:
```
❌ Saldo Tidak Mencukupi

Saldo Kas saat ini: Rp 2.000.000
Total pengembalian: Rp 3.350.000
Kekurangan: Rp 1.350.000

Silakan:
1. Tambah saldo Kas, atau
2. Gunakan metode Transfer Bank jika saldo bank mencukupi
```

**Solusi**:
1. Cek saldo Bank
2. Jika Bank cukup, gunakan metode "Transfer Bank"
3. Jika tidak, tambah saldo Kas terlebih dahulu

### Error: Metode Pembayaran Tidak Dipilih

**Pesan Error**:
```
❌ Metode Pembayaran Wajib Dipilih

Silakan pilih metode pembayaran:
- Kas: Untuk pembayaran tunai
- Transfer Bank: Untuk pembayaran non-tunai
```

**Solusi**:
Pilih salah satu metode pembayaran dari dropdown

### Error: Pengembalian Sudah Diproses

**Pesan Error**:
```
❌ Pengembalian Sudah Diproses

Pengembalian untuk anggota ini sudah diproses pada:
Tanggal: 01/12/2025
Referensi: PGM-20251201-001
Total: Rp 3.350.000

Tidak dapat memproses ulang.
```

**Solusi**:
- Cek laporan pengembalian
- Cetak ulang bukti jika diperlukan

---

## Integrasi Akuntansi

### Akun yang Terpengaruh

1. **Simpanan Pokok Anggota** (Liability)
   - Saldo berkurang (Debit)
   - Menjadi nol setelah pengembalian

2. **Simpanan Wajib Anggota** (Liability)
   - Saldo berkurang (Debit)
   - Menjadi nol setelah pengembalian

3. **Kas** (Asset)
   - Saldo berkurang (Kredit)
   - Jika metode pembayaran = Kas

4. **Bank** (Asset)
   - Saldo berkurang (Kredit)
   - Jika metode pembayaran = Transfer Bank

### Contoh Jurnal Lengkap

**Transaksi**: Pengembalian simpanan Budi Santoso

**Data**:
- Simpanan Pokok: Rp 1.000.000
- Simpanan Wajib: Rp 2.500.000
- Kewajiban: Rp 150.000
- Total: Rp 3.350.000
- Metode: Kas

**Jurnal Entry**:
```
Tanggal: 05/12/2025
Referensi: PGM-20251205-001
Keterangan: Pengembalian simpanan - Budi Santoso (NIK: 1234567890123456)

┌──────────────────────────────────────────────────────────┐
│ Akun                      │ Debit       │ Kredit         │
├──────────────────────────────────────────────────────────┤
│ Simpanan Pokok Anggota    │ 1.000.000   │                │
│ Simpanan Wajib Anggota    │ 2.500.000   │                │
│ Kas                       │             │ 3.500.000      │
├──────────────────────────────────────────────────────────┤
│ TOTAL                     │ 3.500.000   │ 3.500.000      │
└──────────────────────────────────────────────────────────┘

Status: ✅ Balanced (Debit = Kredit)
```

**Catatan**: Kewajiban Rp 150.000 sudah dipotong dari total pengembalian, sehingga yang keluar dari Kas hanya Rp 3.350.000. Namun jurnal tetap mencatat full amount simpanan.

### Verifikasi Jurnal

**Checklist Verifikasi**:
- [ ] Debit = Kredit (Balanced)
- [ ] Referensi transaksi tercatat
- [ ] Nama anggota tercatat
- [ ] Tanggal sesuai
- [ ] Saldo COA terupdate

**Cara Cek**:
1. Buka menu "Akuntansi" → "Jurnal Umum"
2. Filter tanggal = tanggal pengembalian
3. Cari dengan referensi PGM-YYYYMMDD-XXX
4. Verifikasi semua field

---

## FAQ

### Q1: Apakah bisa memproses pengembalian sebagian?

**A**: Tidak. Sistem dirancang untuk pengembalian penuh. Semua simpanan pokok dan wajib harus dikembalikan sekaligus.

### Q2: Bagaimana jika anggota masih punya hutang POS?

**A**: Hutang POS akan otomatis dipotong dari total pengembalian. Jika hutang lebih besar dari simpanan, pengembalian tidak dapat diproses.

### Q3: Apakah bisa mengubah metode pembayaran setelah diproses?

**A**: Tidak. Setelah pengembalian diproses, data tidak dapat diubah. Pastikan memilih metode yang benar sebelum konfirmasi.

### Q4: Bagaimana jika salah input tanggal pembayaran?

**A**: Tanggal pembayaran tidak dapat diubah setelah diproses. Jika sangat diperlukan, hubungi administrator untuk koreksi manual di database.

### Q5: Apakah bukti pengembalian bisa dicetak ulang?

**A**: Ya. Buka menu "Laporan Anggota Keluar", cari anggota yang bersangkutan, klik tombol "Cetak Bukti".

### Q6: Bagaimana jika printer tidak tersedia?

**A**: Simpan bukti sebagai PDF menggunakan fitur "Print to PDF" di browser. File PDF dapat dicetak nanti atau dikirim via email.

### Q7: Apakah ada limit jumlah pengembalian?

**A**: Tidak ada limit dari sistem. Yang penting saldo kas/bank mencukupi.

### Q8: Bagaimana jika terjadi error saat proses?

**A**: Sistem menggunakan transaction rollback. Jika terjadi error, semua perubahan akan dibatalkan otomatis. Data tetap aman.

### Q9: Apakah pengembalian bisa dibatalkan?

**A**: Tidak. Setelah status "Selesai", pengembalian tidak dapat dibatalkan. Jika benar-benar diperlukan, hubungi administrator.

### Q10: Bagaimana cara melacak pengembalian yang sudah diproses?

**A**: Gunakan menu "Laporan Anggota Keluar". Filter berdasarkan status "Selesai" dan periode yang diinginkan.

---

## Lampiran: Checklist Lengkap

### Checklist Sebelum Proses

- [ ] Anggota sudah ditandai "Keluar"
- [ ] Semua pinjaman sudah lunas
- [ ] Tidak ada hutang POS atau sudah dicatat
- [ ] Data anggota sudah diverifikasi
- [ ] Saldo kas/bank mencukupi
- [ ] Metode pembayaran sudah ditentukan

### Checklist Saat Proses

- [ ] Review perhitungan simpanan
- [ ] Verifikasi total pengembalian
- [ ] Pilih metode pembayaran yang tepat
- [ ] Isi tanggal pembayaran
- [ ] Tambahkan keterangan jika perlu
- [ ] Konfirmasi sekali lagi sebelum proses

### Checklist Setelah Proses

- [ ] Cetak bukti pengembalian
- [ ] Minta tanda tangan anggota
- [ ] Arsipkan bukti pengembalian
- [ ] Verifikasi jurnal di sistem akuntansi
- [ ] Update catatan administrasi
- [ ] Lakukan transfer jika metode = Bank

---

**Versi Dokumen**: 1.0  
**Terakhir Diperbarui**: 5 Desember 2025  
**Dibuat oleh**: Tim Pengembang Aplikasi Koperasi
