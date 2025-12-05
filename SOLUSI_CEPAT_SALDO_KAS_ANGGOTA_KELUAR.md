# Solusi Cepat: Saldo Kas Tidak Mencukupi pada Anggota Keluar

## Masalah
Muncul error "saldo kas tidak mencukupi" padahal di kas ada saldo.

## Penyebab
Sistem sekarang memeriksa saldo berdasarkan **metode pembayaran** yang dipilih:
- Jika pilih **"Kas"** → cek saldo Kas (1-1000)
- Jika pilih **"Transfer Bank"** → cek saldo Bank (1-1100)

## Solusi Cepat

### ✅ Langkah 1: Cek Saldo Anda

1. Buka menu **Keuangan > Jurnal**
2. Lihat saldo:
   - **Kas (1-1000)**: Saldo kas tunai
   - **Bank (1-1100)**: Saldo rekening bank

### ✅ Langkah 2: Pilih Metode yang Tepat

Saat proses pengembalian:

| Kondisi | Pilih Metode |
|---------|--------------|
| Saldo Kas cukup | **Kas** |
| Saldo Bank cukup | **Transfer Bank** |
| Keduanya tidak cukup | Lihat Langkah 3 |

### ✅ Langkah 3: Jika Saldo Tidak Cukup

**Opsi A: Transfer dari Bank ke Kas**

Jika saldo Bank cukup tapi Kas tidak:

1. Menu: **Keuangan > Jurnal > Tambah Jurnal**
2. Isi:
   - Tanggal: [hari ini]
   - Keterangan: `Transfer Bank ke Kas`
3. Entry:
   - Baris 1: Pilih akun **Kas (1-1000)**, Debit: [jumlah yang dibutuhkan]
   - Baris 2: Pilih akun **Bank (1-1100)**, Kredit: [jumlah yang sama]
4. Klik **Simpan**
5. Kembali ke proses pengembalian, pilih metode **"Kas"**

**Opsi B: Gunakan Transfer Bank**

Jika saldo Bank cukup:
- Langsung pilih metode **"Transfer Bank"** saat proses pengembalian

**Opsi C: Tambah Modal**

Jika total saldo (Kas + Bank) tidak cukup:

1. Menu: **Keuangan > Jurnal > Tambah Jurnal**
2. Isi:
   - Keterangan: `Setoran Modal Tambahan`
3. Entry:
   - Baris 1: Pilih **Kas (1-1000)** atau **Bank (1-1100)**, Debit: [jumlah]
   - Baris 2: Pilih **Modal (3-1000)**, Kredit: [jumlah yang sama]
4. Klik **Simpan**

## Contoh Praktis

### Contoh 1: Saldo Bank Cukup

**Situasi:**
- Pengembalian: Rp 5.000.000
- Kas: Rp 1.000.000 ❌
- Bank: Rp 8.000.000 ✅

**Solusi:**
Pilih metode **"Transfer Bank"** → Selesai! ✅

### Contoh 2: Perlu Transfer

**Situasi:**
- Pengembalian: Rp 3.000.000
- Kas: Rp 500.000 ❌
- Bank: Rp 5.000.000 ✅

**Solusi:**
1. Transfer Rp 3.000.000 dari Bank ke Kas
2. Pilih metode **"Kas"** → Selesai! ✅

## Tips

💡 **Rekomendasi:**
- Jika ada saldo Bank yang cukup, lebih mudah pilih **"Transfer Bank"** langsung
- Tidak perlu transfer dari Bank ke Kas kecuali memang ingin bayar tunai

💡 **Cek Saldo Sebelum Proses:**
- Selalu cek saldo Kas dan Bank sebelum proses pengembalian
- Pastikan metode pembayaran sesuai dengan saldo yang tersedia

## Bantuan Lebih Lanjut

Jika masih ada masalah, hubungi administrator sistem atau lihat dokumentasi lengkap di:
- `PERBAIKAN_VALIDASI_SALDO_KAS_ANGGOTA_KELUAR.md`
- `PANDUAN_ANGGOTA_KELUAR.md`

---

**Terakhir diperbarui:** 5 Desember 2025
