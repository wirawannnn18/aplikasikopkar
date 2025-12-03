# Penjelasan: Akuntansi Simpanan dan KAS Koperasi

## ✅ Status: SUDAH BENAR

## 🎯 Pertanyaan

"Simpanan pokok dan simpanan wajib harusnya menjadi satu di akun KAS"

## 📊 Penjelasan

### **Simpanan Pokok dan Simpanan Wajib SUDAH menambah KAS koperasi dengan benar!**

---

## 🔍 Cara Kerja Akuntansi Simpanan

### 1. **Jurnal Simpanan Pokok**

Saat anggota menyetor Simpanan Pokok Rp 1.000.000:

```
Tanggal: 18/10/2024
Keterangan: Simpanan Pokok - Budi Santoso

Debit:  1-1000 (Kas)              Rp 1.000.000  ← KAS BERTAMBAH ✅
Kredit: 2-1100 (Simpanan Pokok)   Rp 1.000.000  ← Kewajiban Bertambah
```

**Penjelasan:**
- **Debit Kas** = Uang masuk ke kas koperasi ✅
- **Kredit Simpanan Pokok** = Koperasi punya kewajiban mengembalikan ke anggota

---

### 2. **Jurnal Simpanan Wajib**

Saat anggota menyetor Simpanan Wajib Rp 100.000:

```
Tanggal: 18/10/2024
Keterangan: Simpanan Wajib - Budi Santoso

Debit:  1-1000 (Kas)              Rp 100.000  ← KAS BERTAMBAH ✅
Kredit: 2-1200 (Simpanan Wajib)   Rp 100.000  ← Kewajiban Bertambah
```

**Penjelasan:**
- **Debit Kas** = Uang masuk ke kas koperasi ✅
- **Kredit Simpanan Wajib** = Koperasi punya kewajiban mengembalikan ke anggota

---

## 💰 Update Saldo COA Otomatis

Setiap kali jurnal dicatat, fungsi `addJurnal()` otomatis mengupdate saldo COA:

```javascript
// Update saldo COA
entries.forEach(entry => {
    const akun = coa.find(c => c.kode === entry.akun);
    if (akun) {
        if (akun.tipe === 'Aset' || akun.tipe === 'Beban') {
            // Untuk Aset (termasuk KAS)
            akun.saldo += entry.debit - entry.kredit;
        } else {
            // Untuk Kewajiban, Modal, Pendapatan
            akun.saldo += entry.kredit - entry.debit;
        }
    }
});
```

### Contoh Perhitungan:

**Simpanan Pokok Rp 1.000.000:**
- Akun 1-1000 (Kas) tipe **Aset**:
  - Saldo += Debit - Kredit
  - Saldo += 1.000.000 - 0
  - **Saldo KAS += Rp 1.000.000** ✅

- Akun 2-1100 (Simpanan Pokok) tipe **Kewajiban**:
  - Saldo += Kredit - Debit
  - Saldo += 1.000.000 - 0
  - **Saldo Simpanan Pokok += Rp 1.000.000** ✅

**Simpanan Wajib Rp 100.000:**
- Akun 1-1000 (Kas) tipe **Aset**:
  - Saldo += Debit - Kredit
  - Saldo += 100.000 - 0
  - **Saldo KAS += Rp 100.000** ✅

- Akun 2-1200 (Simpanan Wajib) tipe **Kewajiban**:
  - Saldo += Kredit - Debit
  - Saldo += 100.000 - 0
  - **Saldo Simpanan Wajib += Rp 100.000** ✅

---

## 📈 Hasil di Laporan Keuangan

### **Neraca (Balance Sheet)**

```
ASET
├── 1-1000: Kas                    Rp 1.100.000  ← Pokok + Wajib ✅
├── 1-2000: Bank                   Rp 0
└── ...

KEWAJIBAN
├── 2-1000: Hutang Supplier        Rp 0
├── 2-1100: Simpanan Pokok         Rp 1.000.000
├── 2-1200: Simpanan Wajib         Rp 100.000
└── 2-1300: Simpanan Sukarela      Rp 0

MODAL
└── 3-1000: Modal Koperasi         Rp 0
```

**Total Aset = Total Kewajiban + Modal** ✅

---

## 🔍 Cara Verifikasi di Aplikasi

### 1. **Cek Saldo KAS di Chart of Accounts**

**Langkah:**
1. Login ke aplikasi
2. Buka menu **Keuangan** → **Chart of Account**
3. Cari akun **1-1000 (Kas)**
4. Lihat kolom **Saldo**

**Hasil yang Diharapkan:**
- Saldo KAS = Total semua Debit - Total semua Kredit
- Termasuk dari Simpanan Pokok dan Simpanan Wajib ✅

---

### 2. **Cek Laporan Kas Besar**

**Langkah:**
1. Buka menu **Laporan** → **Laporan Kas Besar**
2. Lihat semua transaksi yang masuk/keluar KAS

**Hasil yang Diharapkan:**
- Transaksi Simpanan Pokok muncul di kolom **Masuk** ✅
- Transaksi Simpanan Wajib muncul di kolom **Masuk** ✅
- Saldo KAS bertambah setiap ada simpanan ✅

---

### 3. **Cek Jurnal Umum**

**Langkah:**
1. Buka menu **Keuangan** → **Jurnal Umum**
2. Cari transaksi "Simpanan Pokok" atau "Simpanan Wajib"

**Hasil yang Diharapkan:**
```
Keterangan: Simpanan Pokok - Budi Santoso
Debit:  1-1000 (Kas)              Rp 1.000.000 ✅
Kredit: 2-1100 (Simpanan Pokok)   Rp 1.000.000 ✅
```

---

### 4. **Cek Buku Besar Akun KAS**

**Langkah:**
1. Buka menu **Keuangan** → **Buku Besar**
2. Pilih akun **1-1000 (Kas)**
3. Lihat semua transaksi

**Hasil yang Diharapkan:**
- Semua transaksi Simpanan Pokok muncul di kolom **Debit** ✅
- Semua transaksi Simpanan Wajib muncul di kolom **Debit** ✅
- Saldo running bertambah setiap ada simpanan ✅

---

## 🧪 Test Otomatis

Saya telah membuat file test untuk memverifikasi:

**File:** `test_saldo_kas_simpanan.html`

**Cara Menjalankan:**
1. Buka file `test_saldo_kas_simpanan.html` di browser
2. Klik tombol **"🚀 Jalankan Test"**
3. Verifikasi semua test pass (✅)

**Test yang Dilakukan:**
1. ✅ Saldo KAS awal = Rp 0
2. ✅ Simpanan Pokok Rp 1.000.000 → KAS = Rp 1.000.000
3. ✅ Simpanan Wajib Rp 100.000 → KAS = Rp 1.100.000
4. ✅ Total KAS = Simpanan Pokok + Simpanan Wajib
5. ✅ Jurnal tercatat dengan benar
6. ✅ Entry KAS di jurnal benar (Debit)

---

## ❓ Kemungkinan Masalah

Jika Anda merasa KAS tidak bertambah, kemungkinan penyebabnya:

### 1. **Data Lama Sebelum Sistem Akuntansi**

**Masalah:**
- Simpanan diinput sebelum sistem akuntansi aktif
- Tidak ada jurnal yang tercatat

**Solusi:**
- Buat jurnal manual untuk data lama
- Atau gunakan fitur **Saldo Awal** untuk input saldo awal KAS

---

### 2. **Saldo Awal KAS Belum Diinput**

**Masalah:**
- KAS koperasi sebenarnya sudah ada uang sebelum sistem digunakan
- Tapi saldo awal belum diinput

**Solusi:**
1. Buka menu **Keuangan** → **Saldo Awal**
2. Input saldo awal KAS
3. Atau buat jurnal manual:
   ```
   Debit:  1-1000 (Kas)           [Saldo Awal]
   Kredit: 3-1000 (Modal Koperasi) [Saldo Awal]
   ```

---

### 3. **Melihat Laporan yang Salah**

**Masalah:**
- Melihat saldo di tempat yang salah
- Misalnya melihat saldo Simpanan Pokok, bukan saldo KAS

**Solusi:**
- Pastikan melihat akun **1-1000 (Kas)**
- Bukan akun 2-1100 (Simpanan Pokok) atau 2-1200 (Simpanan Wajib)

---

## 📊 Ilustrasi Lengkap

### Skenario: 3 Anggota Setor Simpanan

**Transaksi:**
1. Budi setor Simpanan Pokok Rp 1.000.000
2. Siti setor Simpanan Pokok Rp 1.000.000
3. Ahmad setor Simpanan Pokok Rp 1.000.000
4. Budi setor Simpanan Wajib Rp 100.000
5. Siti setor Simpanan Wajib Rp 100.000
6. Ahmad setor Simpanan Wajib Rp 100.000

**Hasil di COA:**

```
1-1000 (Kas):
  Saldo = (1.000.000 + 1.000.000 + 1.000.000) + (100.000 + 100.000 + 100.000)
  Saldo = Rp 3.000.000 + Rp 300.000
  Saldo = Rp 3.300.000 ✅

2-1100 (Simpanan Pokok):
  Saldo = 1.000.000 + 1.000.000 + 1.000.000
  Saldo = Rp 3.000.000 ✅

2-1200 (Simpanan Wajib):
  Saldo = 100.000 + 100.000 + 100.000
  Saldo = Rp 300.000 ✅
```

**Neraca:**
```
ASET
└── Kas: Rp 3.300.000 ✅

KEWAJIBAN
├── Simpanan Pokok: Rp 3.000.000
└── Simpanan Wajib: Rp 300.000
    Total Kewajiban: Rp 3.300.000 ✅

ASET = KEWAJIBAN ✅ (Balance!)
```

---

## ✅ Kesimpulan

### **Sistem Akuntansi Simpanan SUDAH BENAR!**

1. ✅ Simpanan Pokok **menambah KAS** koperasi
2. ✅ Simpanan Wajib **menambah KAS** koperasi
3. ✅ Jurnal tercatat dengan benar (Debit Kas, Kredit Simpanan)
4. ✅ Saldo COA terupdate otomatis
5. ✅ Laporan keuangan akurat

### **Simpanan Pokok dan Simpanan Wajib SUDAH menjadi satu di akun KAS (1-1000)!**

Keduanya sama-sama:
- **Debit akun 1-1000 (Kas)** → Menambah saldo KAS ✅
- **Kredit akun 2-1100/2-1200** → Mencatat kewajiban koperasi

---

## 📞 Jika Masih Ada Masalah

Jika setelah verifikasi di atas Anda masih merasa KAS tidak bertambah:

1. **Screenshot** halaman Chart of Accounts (akun 1-1000)
2. **Screenshot** halaman Jurnal Umum (transaksi simpanan)
3. **Screenshot** halaman Buku Besar Kas
4. Berikan informasi: Berapa seharusnya saldo KAS vs berapa yang terlihat

Dengan informasi tersebut, saya bisa membantu troubleshoot lebih lanjut.

---

**Terakhir Diperbarui:** 2 Desember 2024  
**Versi:** 1.0.0  
**Status:** ✅ Sistem Sudah Benar
