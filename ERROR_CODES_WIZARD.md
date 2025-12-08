# Error Codes Reference: Wizard Anggota Keluar

## 📋 Daftar Isi

1. [Validation Errors](#validation-errors)
2. [Pencairan Errors](#pencairan-errors)
3. [System Errors](#system-errors)
4. [Recovery Procedures](#recovery-procedures)

---

## Validation Errors

### OUTSTANDING_DEBT_EXISTS

**Severity:** ERROR  
**Step:** 1 (Validasi Hutang/Piutang)

**Description:**  
Anggota masih memiliki kewajiban finansial yang belum diselesaikan.

**Causes:**
- Pinjaman aktif dengan sisaPinjaman > 0
- Piutang aktif dengan sisaPiutang > 0

**Error Response:**
```javascript
{
  code: 'OUTSTANDING_DEBT_EXISTS',
  message: 'Anggota masih memiliki kewajiban finansial yang belum diselesaikan',
  details: {
    pinjamanCount: 2,
    totalPinjaman: 5000000,
    piutangCount: 1,
    totalPiutang: 500000,
    pinjaman: [...],
    piutang: [...]
  }
}
```

**Recovery Steps:**
1. Selesaikan semua pinjaman aktif
2. Bayar semua hutang POS
3. Verifikasi tidak ada kewajiban tersisa
4. Mulai wizard lagi

---

### ANGGOTA_NOT_FOUND

**Severity:** ERROR  
**Step:** All

**Description:**  
Anggota dengan ID yang diberikan tidak ditemukan di sistem.

**Causes:**
- ID anggota tidak valid
- Data anggota sudah dihapus
- Kesalahan input ID

**Error Response:**
```javascript
{
  code: 'ANGGOTA_NOT_FOUND',
  message: 'Anggota tidak ditemukan'
}
```

**Recovery Steps:**
1. Verifikasi ID anggota benar
2. Refresh halaman
3. Cari anggota lagi dari daftar
4. Hubungi administrator jika masalah berlanjut

---

## Pencairan Errors

### INSUFFICIENT_BALANCE

**Severity:** WARNING  
**Step:** 2 (Pencairan Simpanan)

**Description:**  
Saldo kas atau bank tidak mencukupi untuk melakukan pencairan.

**Causes:**
- Saldo kas < total pencairan (metode Kas)
- Saldo bank < total pencairan (metode Transfer Bank)
- Total saldo < total pencairan (metode tidak ditentukan)

**Error Response:**
```javascript
{
  code: 'INSUFFICIENT_BALANCE',
  message: 'Saldo kas tidak mencukupi...',
  field: 'kas',
  severity: 'warning',
  data: {
    required: 5000000,
    available: 3000000,
    shortfall: 2000000,
    paymentMethod: 'Kas'
  }
}
```

**Recovery Steps:**
1. Periksa saldo kas dan bank saat ini
2. Tambah saldo jika diperlukan
3. Gunakan metode pembayaran yang berbeda
4. Tunda pencairan sampai saldo mencukupi
5. Pastikan dana tersedia sebelum melanjutkan

---

### JOURNAL_IMBALANCE

**Severity:** CRITICAL  
**Step:** 2 (Pencairan Simpanan)

**Description:**  
Jurnal tidak seimbang - total debit tidak sama dengan total kredit.

**Causes:**
- Error dalam perhitungan jurnal
- Bug dalam sistem
- Data corruption

**Error Response:**
```javascript
{
  code: 'JOURNAL_IMBALANCE',
  message: 'Jurnal tidak seimbang. Terjadi kesalahan dalam pencatatan',
  severity: 'critical'
}
```

**Recovery Steps:**
1. **JANGAN** lanjutkan proses
2. Hubungi administrator sistem SEGERA
3. Data akan di-rollback otomatis
4. Laporkan error untuk diperbaiki
5. Tunggu perbaikan sebelum mencoba lagi

---

### PAYMENT_METHOD_REQUIRED

**Severity:** ERROR  
**Step:** 2 (Pencairan Simpanan)

**Description:**  
Metode pembayaran harus dipilih.

**Causes:**
- Field metode pembayaran kosong
- Nilai null atau undefined

**Error Response:**
```javascript
{
  code: 'PAYMENT_METHOD_REQUIRED',
  message: 'Metode pembayaran harus dipilih',
  field: 'metodePembayaran',
  severity: 'error'
}
```

**Recovery Steps:**
1. Pilih metode pembayaran (Kas atau Transfer Bank)
2. Pastikan field tidak kosong
3. Submit form lagi

---

### INVALID_PAYMENT_METHOD

**Severity:** ERROR  
**Step:** 2 (Pencairan Simpanan)

**Description:**  
Metode pembayaran yang dipilih tidak valid.

**Causes:**
- Nilai metode pembayaran tidak sesuai
- Bukan "Kas" atau "Transfer Bank"

**Error Response:**
```javascript
{
  code: 'INVALID_PAYMENT_METHOD',
  message: 'Metode pembayaran tidak valid. Pilihan: Kas, Transfer Bank',
  field: 'metodePembayaran',
  severity: 'error',
  data: {
    provided: 'Invalid Value',
    validOptions: ['Kas', 'Transfer Bank']
  }
}
```

**Recovery Steps:**
1. Pilih salah satu dari: "Kas" atau "Transfer Bank"
2. Jangan input manual
3. Gunakan dropdown yang disediakan

---

## System Errors

### SYSTEM_ERROR

**Severity:** ERROR  
**Step:** All

**Description:**  
Terjadi kesalahan sistem yang tidak terduga.

**Causes:**
- Exception tidak tertangani
- Error JavaScript
- Masalah koneksi
- Storage error

**Error Response:**
```javascript
{
  code: 'SYSTEM_ERROR',
  message: 'Terjadi kesalahan sistem',
  timestamp: '2024-12-09T10:00:00.000Z'
}
```

**Recovery Steps:**
1. Coba lagi
2. Refresh halaman
3. Clear cache browser
4. Cek console untuk detail error
5. Hubungi administrator jika masalah berlanjut

---

### SNAPSHOT_FAILED

**Severity:** CRITICAL  
**Step:** All (saat snapshot dibuat)

**Description:**  
Gagal membuat backup data untuk rollback.

**Causes:**
- Kapasitas localStorage penuh
- Browser storage error
- Quota exceeded

**Error Response:**
```javascript
{
  code: 'SNAPSHOT_FAILED',
  message: 'Gagal membuat backup data',
  severity: 'critical'
}
```

**Recovery Steps:**
1. Periksa kapasitas penyimpanan browser
2. Clear cache dan cookies
3. Hapus data yang tidak diperlukan
4. Coba refresh halaman
5. Gunakan browser berbeda jika masalah berlanjut
6. Hubungi administrator

---

### ROLLBACK_FAILED

**Severity:** CRITICAL  
**Step:** All (saat rollback diperlukan)

**Description:**  
Gagal melakukan rollback data. Data mungkin tidak konsisten.

**Causes:**
- Error dalam proses rollback
- Snapshot tidak tersedia
- Storage error
- Data corruption

**Error Response:**
```javascript
{
  code: 'ROLLBACK_FAILED',
  message: 'Gagal melakukan rollback. Data mungkin tidak konsisten',
  severity: 'critical'
}
```

**Recovery Steps:**
1. **SEGERA** hubungi administrator
2. **JANGAN** lakukan transaksi lain
3. **JANGAN** tutup browser
4. Backup data manual jika memungkinkan
5. Tunggu instruksi dari administrator
6. Mungkin perlu restore dari backup

---

### INVALID_PARAMETER

**Severity:** ERROR  
**Step:** All

**Description:**  
Parameter yang diberikan tidak valid.

**Causes:**
- Parameter kosong
- Tipe data salah
- Format tidak sesuai

**Error Response:**
```javascript
{
  code: 'INVALID_PARAMETER',
  message: 'ID anggota tidak valid',
  timestamp: '2024-12-09T10:00:00.000Z'
}
```

**Recovery Steps:**
1. Periksa input yang diberikan
2. Pastikan format sesuai
3. Jangan kosongkan field wajib
4. Coba lagi dengan input yang benar

---

### INVALID_DATE_FORMAT

**Severity:** ERROR  
**Step:** 2, 4

**Description:**  
Format tanggal tidak sesuai dengan yang diharapkan.

**Causes:**
- Format bukan YYYY-MM-DD
- Tanggal tidak valid
- Input manual salah

**Error Response:**
```javascript
{
  code: 'INVALID_DATE_FORMAT',
  message: 'Format tanggal harus YYYY-MM-DD',
  timestamp: '2024-12-09T10:00:00.000Z'
}
```

**Recovery Steps:**
1. Gunakan date picker yang disediakan
2. Jangan input manual
3. Format harus: YYYY-MM-DD (contoh: 2024-12-09)

---

### INVALID_DATE

**Severity:** ERROR  
**Step:** 2, 4

**Description:**  
Tanggal tidak valid (misalnya di masa depan).

**Causes:**
- Tanggal lebih besar dari hari ini
- Tanggal tidak logis

**Error Response:**
```javascript
{
  code: 'INVALID_DATE',
  message: 'Tanggal keluar tidak boleh di masa depan',
  timestamp: '2024-12-09T10:00:00.000Z'
}
```

**Recovery Steps:**
1. Pilih tanggal hari ini atau sebelumnya
2. Jangan pilih tanggal masa depan
3. Gunakan date picker dengan max date

---

## Recovery Procedures

### General Recovery Procedure

Untuk semua error, ikuti langkah umum ini:

1. **Baca Pesan Error**
   - Pahami apa yang salah
   - Catat kode error

2. **Cek Detail Error**
   - Lihat informasi tambahan
   - Identifikasi penyebab

3. **Ikuti Recovery Steps**
   - Lakukan langkah yang disarankan
   - Jangan skip langkah

4. **Coba Lagi**
   - Setelah perbaikan, coba lagi
   - Verifikasi masalah teratasi

5. **Escalate Jika Perlu**
   - Hubungi administrator
   - Berikan detail error lengkap

---

### Critical Error Procedure

Untuk error CRITICAL (JOURNAL_IMBALANCE, ROLLBACK_FAILED, SNAPSHOT_FAILED):

1. **STOP Immediately**
   - Jangan lanjutkan proses
   - Jangan tutup browser

2. **Document Everything**
   - Screenshot error
   - Catat waktu kejadian
   - Catat langkah yang dilakukan

3. **Contact Administrator**
   - Segera hubungi
   - Berikan semua informasi
   - Tunggu instruksi

4. **Do NOT**
   - Jangan coba lagi sendiri
   - Jangan lakukan transaksi lain
   - Jangan clear cache/data

5. **Wait for Resolution**
   - Tunggu administrator
   - Ikuti instruksi yang diberikan
   - Verifikasi data setelah perbaikan

---

### Data Inconsistency Procedure

Jika terjadi ketidakkonsistenan data:

1. **Identify the Issue**
   - Data tidak sesuai
   - Saldo tidak balance
   - Record hilang

2. **Stop Operations**
   - Hentikan semua transaksi
   - Jangan ubah data

3. **Report to Administrator**
   - Detail masalah
   - Waktu kejadian
   - Data yang terpengaruh

4. **Backup Current State**
   - Export data jika memungkinkan
   - Screenshot kondisi saat ini

5. **Wait for Fix**
   - Administrator akan investigate
   - Mungkin perlu restore backup
   - Verifikasi setelah perbaikan

---

## Error Severity Levels

### INFO
- Informasi saja
- Tidak menghalangi proses
- Tidak perlu action

### WARNING
- Peringatan
- Proses bisa dilanjutkan
- Perlu perhatian

### ERROR
- Error yang menghalangi proses
- Perlu perbaikan
- Proses tidak bisa dilanjutkan

### CRITICAL
- Error serius
- Bisa menyebabkan data inconsistency
- Perlu immediate action
- Hubungi administrator SEGERA

---

## Contact Information

Jika mengalami error yang tidak bisa diselesaikan:

📧 **Email:** support@koperasi.com  
📞 **Telepon:** (021) 1234-5678  
💬 **Chat:** Tersedia di aplikasi (jam kerja)  
🆘 **Emergency:** (021) 9999-9999 (24/7 untuk CRITICAL errors)

---

**Versi Dokumen:** 1.0  
**Terakhir Diupdate:** 2024-12-09  
**Dibuat oleh:** Tim Pengembangan Koperasi
