# Quick Reference: Pengembalian Simpanan

## 🎯 Ringkasan Fitur

Fitur pengembalian simpanan yang telah diperbaiki untuk memastikan:
- ✅ Saldo simpanan di-zero-kan setelah pengembalian
- ✅ Anggota keluar tidak muncul di master anggota
- ✅ Anggota keluar tidak bisa transaksi
- ✅ Laporan hanya tampilkan saldo aktif (> 0)
- ✅ Surat pengunduran diri dapat di-print
- ✅ Rollback otomatis jika terjadi error

## 📋 Cara Menggunakan

### 1. Menandai Anggota Keluar

**Langkah:**
1. Buka menu **Master Anggota**
2. Cari anggota yang akan keluar
3. Klik tombol **Anggota Keluar** (ikon box-arrow-right)
4. Isi form:
   - Tanggal Keluar
   - Alasan Keluar
5. Klik **Simpan**

**Hasil:**
- Status anggota berubah menjadi "Keluar"
- Pengembalian status: "Pending"
- Anggota tidak muncul di master anggota
- Anggota tidak bisa transaksi

### 2. Memproses Pengembalian Simpanan

**Langkah:**
1. Buka menu **Anggota Keluar**
2. Cari anggota dengan status pengembalian "Pending"
3. Klik tombol **Proses Pengembalian** (ikon cash-coin)
4. Review perhitungan:
   - Simpanan Pokok
   - Simpanan Wajib
   - Kewajiban Lain (jika ada)
   - Total Pengembalian
5. Pilih metode pembayaran (Kas/Transfer Bank)
6. Pilih tanggal pembayaran
7. Tambahkan keterangan (opsional)
8. Klik **Proses Pengembalian**

**Hasil:**
- Saldo simpanan = 0
- Historical data tersimpan
- Jurnal akuntansi dibuat
- Status pengembalian: "Selesai"
- Tombol cetak surat muncul

### 3. Mencetak Surat Pengunduran Diri

**Langkah:**
1. Setelah pengembalian selesai, modal muncul dengan 3 opsi:
   - Cetak Bukti Pengembalian
   - Cetak Surat Pengunduran Diri
   - Cetak Kedua Dokumen
2. Pilih opsi yang diinginkan
3. Window baru terbuka dengan dokumen
4. Klik tombol **Cetak** atau tekan Ctrl+P
5. Pilih printer dan cetak

**Atau dari Laporan Anggota Keluar:**
1. Buka menu **Anggota Keluar**
2. Cari anggota dengan status "Selesai"
3. Klik tombol hijau **Cetak Surat** di kolom aksi
4. Window baru terbuka dengan surat
5. Cetak dokumen

### 4. Melihat Laporan Simpanan

**Langkah:**
1. Buka menu **Laporan Simpanan**
2. Pilih jenis laporan:
   - Simpanan Pokok
   - Simpanan Wajib
   - Simpanan Sukarela
3. Laporan otomatis filter saldo > 0
4. Anggota keluar tidak muncul (karena saldo = 0)

### 5. Mencegah Transaksi Anggota Keluar

**Otomatis:**
- Sistem otomatis memblokir transaksi untuk anggota keluar
- Berlaku untuk:
  - Transaksi POS
  - Pembayaran Kasbon
  - Simpanan
  - Pinjaman
- Error message muncul jika mencoba transaksi

## 🔍 Verifikasi

### Cek Saldo Simpanan = 0
1. Buka menu **Anggota Keluar**
2. Klik detail anggota
3. Lihat rincian pengembalian
4. Verify saldo sekarang = 0

### Cek Jurnal Akuntansi
1. Buka menu **Jurnal/Ledger**
2. Cari entry "Pengembalian Simpanan"
3. Verify:
   - Debit: Simpanan Pokok (2-1100)
   - Debit: Simpanan Wajib (2-1200)
   - Kredit: Kas (1-1000) atau Bank (1-1100)
   - Total Debit = Total Kredit

### Cek Master Anggota
1. Buka menu **Master Anggota**
2. Cari anggota keluar by name/NIK
3. Verify: Tidak muncul di hasil pencarian
4. Check total count: Tidak include anggota keluar

## ⚠️ Troubleshooting

### Pengembalian Gagal
**Gejala:** Error saat proses pengembalian

**Solusi:**
1. Check saldo kas/bank mencukupi
2. Check tidak ada pinjaman aktif
3. Check data anggota lengkap
4. Lihat audit log untuk detail error
5. Data otomatis di-rollback, aman untuk retry

### Surat Tidak Muncul
**Gejala:** Tombol cetak surat tidak muncul

**Solusi:**
1. Pastikan pengembalian status = "Selesai"
2. Refresh halaman
3. Check browser tidak block popup

### Anggota Keluar Masih Muncul
**Gejala:** Anggota keluar masih di master anggota

**Solusi:**
1. Refresh halaman
2. Clear filter
3. Check statusKeanggotaan = "Keluar"

### Transaksi Tidak Terblokir
**Gejala:** Anggota keluar masih bisa transaksi

**Solusi:**
1. Check file `js/transactionValidator.js` loaded
2. Check console untuk error
3. Verify statusKeanggotaan = "Keluar"

## 📊 Data yang Tersimpan

### Simpanan (After Pengembalian)
```javascript
{
    id: "sp-001",
    anggotaId: "ANG-001",
    jumlah: 0,  // ← Zeroed out
    tanggal: "2024-01-15",
    saldoSebelumPengembalian: 500000,  // ← Historical
    statusPengembalian: "Dikembalikan",
    pengembalianId: "PGM-001",
    tanggalPengembalian: "2024-12-05"
}
```

### Pengembalian Record
```javascript
{
    id: "PGM-001",
    anggotaId: "ANG-001",
    anggotaNama: "John Doe",
    anggotaNIK: "1234567890",
    simpananPokok: 500000,
    simpananWajib: 300000,
    totalSimpanan: 800000,
    kewajibanLain: 0,
    totalPengembalian: 800000,
    metodePembayaran: "Kas",
    tanggalPembayaran: "2024-12-05",
    nomorReferensi: "PGM-202412-12345678",
    status: "Selesai",
    jurnalId: "JRN-001"
}
```

### Audit Log (Success)
```javascript
{
    id: "AUDIT-001",
    timestamp: "2024-12-05T10:30:00.000Z",
    userId: "user-123",
    userName: "Admin",
    action: "PROSES_PENGEMBALIAN",
    anggotaId: "ANG-001",
    anggotaNama: "John Doe",
    details: {
        pengembalianId: "PGM-001",
        nomorReferensi: "PGM-202412-12345678",
        totalPengembalian: 800000,
        metodePembayaran: "Kas"
    }
}
```

### Audit Log (Failed)
```javascript
{
    id: "AUDIT-002",
    timestamp: "2024-12-05T10:35:00.000Z",
    userId: "user-123",
    userName: "Admin",
    action: "PROSES_PENGEMBALIAN_FAILED",
    anggotaId: "ANG-001",
    anggotaNama: "John Doe",
    details: {
        error: "Insufficient balance",
        rollbackPerformed: true
    },
    severity: "ERROR"
}
```

## 🧪 Testing

### Automated Tests
**File:** `test_integration_pengembalian_simpanan.html`

**Cara Run:**
1. Open file di browser
2. Click "Setup Test Data"
3. Click "Run All Tests"
4. Verify all tests pass (7/7)

### Manual Testing
**Checklist:**
- [ ] Mark anggota keluar
- [ ] Process pengembalian
- [ ] Verify saldo = 0
- [ ] Check master anggota (tidak muncul)
- [ ] Try transaksi (terblokir)
- [ ] Check laporan (tidak muncul)
- [ ] Cetak surat (berhasil)
- [ ] Check jurnal (correct)

## 📞 Support

### Jika Ada Masalah
1. Check audit log untuk error details
2. Verify data dengan query localStorage
3. Run integration tests
4. Contact developer dengan:
   - Screenshot error
   - Audit log entry
   - Steps to reproduce

### Developer Contact
- Check `FINAL_SUMMARY_FIX_PENGEMBALIAN_SIMPANAN.md` untuk detail teknis
- Check `IMPLEMENTASI_TASK12_INTEGRATION_TESTING.md` untuk testing guide

## 🎓 Training Tips

### Untuk Admin
1. Practice dengan test data dulu
2. Understand complete flow
3. Know how to check audit logs
4. Know how to verify jurnal

### Untuk Kasir
1. Understand transaksi terblokir untuk anggota keluar
2. Know error message yang muncul
3. Know how to check anggota status

### Untuk Manager
1. Understand laporan filtering
2. Know how to verify data accuracy
3. Know how to check audit trail

## ✅ Best Practices

### Do's
- ✅ Always verify saldo before pengembalian
- ✅ Check pinjaman aktif before marking keluar
- ✅ Print surat immediately after pengembalian
- ✅ Verify jurnal after pengembalian
- ✅ Keep audit logs for compliance

### Don'ts
- ❌ Don't mark keluar if ada pinjaman aktif
- ❌ Don't process pengembalian without verification
- ❌ Don't skip printing surat
- ❌ Don't ignore error messages
- ❌ Don't delete audit logs

## 📈 Metrics to Monitor

### Daily
- Jumlah anggota keluar processed
- Success rate pengembalian
- Error count dari audit log

### Weekly
- Total pengembalian amount
- Average processing time
- User satisfaction

### Monthly
- Trend anggota keluar
- Data accuracy verification
- System performance

---

**Version:** 1.0  
**Last Updated:** December 8, 2024  
**Status:** Production Ready ✅

