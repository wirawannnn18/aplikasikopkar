# Quick Reference: Pembayaran Hutang Piutang

## 🚀 Quick Start

### Access the Feature
1. Login as kasir, administrator, or super_admin
2. Click menu "Pembayaran Hutang/Piutang"
3. Choose tab: Form Pembayaran or Riwayat Pembayaran

---

## 💰 Process Pembayaran Hutang

**Scenario:** Anggota membayar hutang kredit POS

1. **Select Jenis:** Pilih "Pembayaran Hutang"
2. **Search Anggota:** Ketik NIK atau nama (min 2 karakter)
3. **Select Anggota:** Klik dari dropdown
4. **Check Saldo:** Lihat saldo hutang yang ditampilkan
5. **Enter Jumlah:** Masukkan jumlah pembayaran
6. **Add Keterangan:** (Optional) Tambahkan catatan
7. **Submit:** Klik "Proses Pembayaran"
8. **Confirm:** Klik OK pada dialog konfirmasi
9. **Print:** (Optional) Cetak bukti pembayaran

**Journal Entry Created:**
```
Debit:  Kas (1-1000)            Rp X
Kredit: Hutang Anggota (2-1000) Rp X
```

---

## 💸 Process Pembayaran Piutang

**Scenario:** Koperasi membayar piutang ke anggota

1. **Select Jenis:** Pilih "Pembayaran Piutang"
2. **Search Anggota:** Ketik NIK atau nama
3. **Select Anggota:** Klik dari dropdown
4. **Check Saldo:** Lihat saldo piutang yang ditampilkan
5. **Enter Jumlah:** Masukkan jumlah pembayaran
6. **Add Keterangan:** (Optional) Tambahkan catatan
7. **Submit:** Klik "Proses Pembayaran"
8. **Confirm:** Klik OK pada dialog konfirmasi
9. **Print:** (Optional) Cetak bukti pembayaran

**Journal Entry Created:**
```
Debit:  Piutang Anggota (1-1200) Rp X
Kredit: Kas (1-1000)             Rp X
```

---

## 📊 View Riwayat

1. **Switch Tab:** Klik "Riwayat Pembayaran"
2. **Apply Filters:**
   - Jenis: Semua / Hutang / Piutang
   - Dari Tanggal: Select start date
   - Sampai Tanggal: Select end date
   - Anggota: Select specific member
3. **View Results:** Table updates automatically
4. **Print Receipt:** Klik icon printer pada baris transaksi

---

## ✅ Validation Rules

| Rule | Error Message |
|------|---------------|
| No anggota selected | "Silakan pilih anggota terlebih dahulu" |
| No jenis selected | "Silakan pilih jenis pembayaran" |
| Jumlah = 0 | "Jumlah pembayaran harus lebih dari 0" |
| Jumlah < 0 | "Jumlah pembayaran tidak boleh negatif" |
| Jumlah > saldo | "Jumlah pembayaran melebihi saldo X" |
| Saldo = 0 | "Anggota tidak memiliki hutang/piutang" |

---

## 🔍 How Saldo is Calculated

### Hutang Saldo
```javascript
Hutang = Σ(POS Kredit) - Σ(Pembayaran Hutang)
```

**Example:**
- POS Kredit: Rp 500,000 + Rp 300,000 = Rp 800,000
- Pembayaran: Rp 200,000
- **Saldo Hutang: Rp 600,000**

### Piutang Saldo
```javascript
Piutang = Σ(Simpanan Pending) - Σ(Pembayaran Piutang)
```

**Example:**
- Simpanan Pending: Rp 1,000,000 + Rp 500,000 = Rp 1,500,000
- Pembayaran: Rp 500,000
- **Saldo Piutang: Rp 1,000,000**

---

## 🖨️ Receipt Contents

- Koperasi header (nama, alamat, telepon)
- Jenis: HUTANG / PIUTANG
- No. Transaksi
- Tanggal & Waktu
- Kasir
- Anggota (nama, NIK)
- Saldo Sebelum
- **Jumlah Bayar** (highlighted)
- Saldo Sesudah
- Keterangan
- Print timestamp

---

## 🔐 Security Features

- ✅ Input sanitization (XSS prevention)
- ✅ Validation before processing
- ✅ Transaction rollback on error
- ✅ Audit trail for all actions
- ✅ Role-based menu access

---

## 📝 Audit Log

Every action is logged:
- Payment processed
- Receipt printed
- User, timestamp, details
- Stored in localStorage

**View Audit Log:**
```javascript
JSON.parse(localStorage.getItem('auditLog'))
```

---

## 🐛 Troubleshooting

### Autocomplete not showing
- Type at least 2 characters
- Wait 300ms (debounce)
- Check anggota exists and is active

### Saldo shows Rp 0
- **Hutang:** Check if anggota has POS kredit transactions
- **Piutang:** Check if anggota has simpanan with statusPengembalian='pending'

### Payment fails
- Check validation errors
- Verify saldo is sufficient
- Check console for errors
- Verify COA accounts exist (1-1000, 1-1200, 2-1000)

### Journal not created
- Check addJurnal() function exists
- Verify COA accounts exist
- Check console for errors
- Transaction will rollback automatically

### Receipt not printing
- Check browser popup blocker
- Verify systemSettings exists
- Check console for errors

---

## 💻 Developer Reference

### Key Functions

```javascript
// Calculate saldo
hitungSaldoHutang(anggotaId)
hitungSaldoPiutang(anggotaId)

// Search
searchAnggota(query)

// Validate
validatePembayaran(data)

// Process
prosesPembayaran()
savePembayaran(data)
rollbackPembayaran(transaksiId)

// Journal
createJurnalPembayaranHutang(transaksi)
createJurnalPembayaranPiutang(transaksi)

// Audit
saveAuditLog(action, details)

// Print
cetakBuktiPembayaran(transaksiId)
```

### Data Structure

```javascript
// Transaction
{
  id: string,
  tanggal: string,
  anggotaId: string,
  anggotaNama: string,
  anggotaNIK: string,
  jenis: 'hutang' | 'piutang',
  jumlah: number,
  saldoSebelum: number,
  saldoSesudah: number,
  keterangan: string,
  kasirId: string,
  kasirNama: string,
  jurnalId: string,
  status: 'selesai' | 'dibatalkan',
  createdAt: string,
  updatedAt: string
}
```

### LocalStorage Keys

```javascript
'pembayaranHutangPiutang'  // Transactions
'penjualan'                 // POS data
'simpanan'                  // Simpanan data
'anggota'                   // Member data
'jurnal'                    // Journal entries
'auditLog'                  // Audit trail
'currentUser'               // Current user
'systemSettings'            // Settings
'coa'                       // Chart of accounts
```

---

## 🧪 Testing

### Manual Test
```
Open: test_pembayaran_hutang_piutang.html
```

### Automated Test
```bash
npm test -- __tests__/pembayaranHutangPiutang.test.js
```

### Test Data
- Anggota A001 (Ahmad): Hutang Rp 800,000
- Anggota A002 (Budi): Hutang Rp 750,000
- Anggota A003 (Citra): Piutang Rp 1,500,000

---

## 📚 Documentation

- **Implementation:** `IMPLEMENTASI_TASK2-10_PEMBAYARAN_HUTANG_PIUTANG.md`
- **Summary:** `SUMMARY_PEMBAYARAN_HUTANG_PIUTANG_COMPLETE.md`
- **Tests:** `__tests__/pembayaranHutangPiutang.test.js`
- **Spec:** `.kiro/specs/pembayaran-hutang-piutang/`

---

## ⚡ Quick Commands

```javascript
// View all transactions
JSON.parse(localStorage.getItem('pembayaranHutangPiutang'))

// View journal entries
JSON.parse(localStorage.getItem('jurnal'))

// View audit log
JSON.parse(localStorage.getItem('auditLog'))

// Check anggota hutang
hitungSaldoHutang('A001')

// Check anggota piutang
hitungSaldoPiutang('A003')

// Reset test data (in test page)
setupTestData()
```

---

**Last Updated:** 2024-12-09  
**Version:** 1.0  
**Status:** Production Ready ✅
