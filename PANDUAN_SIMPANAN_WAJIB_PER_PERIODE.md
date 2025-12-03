# Panduan Simpanan Wajib Per Periode

## 📋 Deskripsi

Panduan ini menjelaskan cara menambahkan **simpanan wajib per periode** untuk anggota koperasi yang dimulai sejak **2024**.

## 🎯 Konsep Simpanan Wajib Per Periode

### Apa itu Simpanan Wajib Per Periode?
Simpanan wajib adalah iuran rutin yang **wajib dibayar** oleh setiap anggota koperasi setiap bulan/periode tertentu.

### Contoh:
- **Periode:** Oktober 2024 (2024-10)
- **Jumlah:** Rp 100.000 per anggota per bulan
- **Tanggal Setor:** Kapan anggota menyetor (misal: 18 Oktober 2024)

---

## 📝 Cara Menambahkan Simpanan Wajib

### **Metode 1: Input Manual (Satu per Satu)**

#### Langkah-langkah:

1. **Buka Menu Simpanan**
   - Login ke aplikasi
   - Klik menu **"Simpanan"** di sidebar
   - Pilih tab **"Simpanan Wajib"**

2. **Klik Tombol "Setor Simpanan Wajib"**
   - Akan muncul form input

3. **Isi Form:**
   - **Pilih Anggota:** Pilih nama anggota dari dropdown
   - **Jumlah Simpanan:** Masukkan jumlah (misal: 100000)
   - **Periode (Bulan/Tahun):** Pilih periode (misal: Oktober 2024 = 2024-10)
   - **Tanggal Setor:** Pilih tanggal setor (misal: 18/10/2024)

4. **Klik "Simpan"**
   - Data akan tersimpan
   - Jurnal akuntansi otomatis tercatat

#### Contoh Input:
```
Anggota: Budi Santoso
Jumlah: Rp 100.000
Periode: 2024-10 (Oktober 2024)
Tanggal Setor: 18/10/2024
```

---

### **Metode 2: Upload CSV/Excel (Banyak Anggota Sekaligus)**

Metode ini **sangat direkomendasikan** untuk input data historis atau banyak anggota sekaligus.

#### Langkah-langkah:

1. **Download Template**
   - Buka menu **Simpanan** → Tab **Simpanan Wajib**
   - Klik tombol **"Download Template"**
   - File `template_simpanan_wajib.csv` akan terdownload

2. **Isi Template di Excel/Spreadsheet**
   
   Format kolom:
   ```
   NIK, Nama, Jumlah, Periode, Tanggal
   ```

   Contoh isi:
   ```csv
   NIK,Nama,Jumlah,Periode,Tanggal
   3201010101010001,Budi Santoso,100000,2024-10,2024-10-18
   3201010101010002,Siti Aminah,100000,2024-10,2024-10-18
   3201010101010003,Ahmad Yani,100000,2024-10,2024-10-18
   ```

3. **Upload File**
   - Klik tombol **"Upload Data CSV/Excel"**
   - Pilih tab **"Upload File"** atau **"Paste Data"**
   
   **Opsi A: Upload File**
   - Klik "Pilih File"
   - Pilih file CSV yang sudah diisi
   - Sistem akan preview data
   
   **Opsi B: Paste Data**
   - Copy data dari Excel (Ctrl+C)
   - Paste di textarea (Ctrl+V)
   - Klik "Preview Data"

4. **Verifikasi Preview**
   - Sistem akan menampilkan preview data
   - Cek status: **Valid** (hijau) atau **Error** (merah)
   - Lihat summary: Total Data, Valid, Error

5. **Proses Upload**
   - Jika data valid, klik **"Proses Upload"**
   - Konfirmasi jumlah data yang akan diproses
   - Klik "OK"
   - Data akan tersimpan dan jurnal otomatis tercatat

---

## 📊 Contoh Kasus: Input Data Historis Sejak Oktober 2024

### Situasi:
Koperasi mulai beroperasi **18 Oktober 2024**. Anda perlu input simpanan wajib untuk:
- **50 anggota**
- **Periode:** Oktober 2024, November 2024
- **Jumlah:** Rp 100.000 per anggota per bulan

### Solusi: Upload CSV

#### 1. Buat File Excel dengan Format:

**File: simpanan_wajib_oktober_2024.csv**
```csv
NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,100000,2024-10,2024-10-18
3201010101010002,Siti Aminah,100000,2024-10,2024-10-18
3201010101010003,Ahmad Yani,100000,2024-10,2024-10-18
... (47 anggota lainnya)
```

**File: simpanan_wajib_november_2024.csv**
```csv
NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,100000,2024-11,2024-11-18
3201010101010002,Siti Aminah,100000,2024-11,2024-11-18
3201010101010003,Ahmad Yani,100000,2024-11,2024-11-18
... (47 anggota lainnya)
```

#### 2. Upload File:
- Upload `simpanan_wajib_oktober_2024.csv` → Proses
- Upload `simpanan_wajib_november_2024.csv` → Proses

#### 3. Hasil:
- ✅ 50 anggota × 2 bulan = 100 transaksi tersimpan
- ✅ Jurnal akuntansi otomatis tercatat
- ✅ Data historis lengkap sejak Oktober 2024

---

## 🔍 Format Periode

### Format yang Benar:
- **YYYY-MM** (ISO format)
- Contoh: `2024-10` (Oktober 2024)
- Contoh: `2024-11` (November 2024)
- Contoh: `2024-12` (Desember 2024)

### Format yang Salah:
- ❌ `10-2024`
- ❌ `Oktober 2024`
- ❌ `10/2024`

---

## 🔍 Format Tanggal

### Format yang Diterima:
1. **YYYY-MM-DD** (ISO format) - **Direkomendasikan**
   - Contoh: `2024-10-18`

2. **DD/MM/YYYY** (Format Indonesia)
   - Contoh: `18/10/2024`
   - Sistem akan otomatis konversi ke ISO

3. **DD-MM-YYYY**
   - Contoh: `18-10-2024`
   - Sistem akan otomatis konversi ke ISO

### Format yang Salah:
- ❌ `18 Oktober 2024`
- ❌ `2024/18/10`

---

## 📌 Tips & Best Practices

### 1. **Input Data Historis (Sejak Oktober 2024)**

**Cara Efisien:**
1. Buat file Excel dengan semua anggota
2. Duplikasi sheet untuk setiap bulan
3. Ubah kolom Periode dan Tanggal sesuai bulan
4. Upload satu per satu per bulan

**Contoh:**
- Sheet 1: Oktober 2024 (Periode: 2024-10, Tanggal: 2024-10-18)
- Sheet 2: November 2024 (Periode: 2024-11, Tanggal: 2024-11-18)
- Sheet 3: Desember 2024 (Periode: 2024-12, Tanggal: 2024-12-02)

### 2. **Simpanan Wajib Bulanan Rutin**

**Untuk bulan berjalan:**
- Gunakan input manual jika hanya beberapa anggota
- Gunakan upload CSV jika banyak anggota (>10)

### 3. **Verifikasi Data**

Setelah upload, verifikasi:
- ✅ Jumlah transaksi sesuai
- ✅ Total simpanan wajib benar
- ✅ Periode tercatat dengan benar
- ✅ Tidak ada duplikasi data

**Cara Cek:**
- Lihat tabel Simpanan Wajib
- Cek footer: Total Simpanan Wajib
- Filter berdasarkan periode jika perlu

### 4. **Menghindari Duplikasi**

⚠️ **Perhatian:** Sistem tidak otomatis cek duplikasi periode per anggota.

**Cara Manual:**
- Sebelum upload, cek apakah anggota sudah bayar periode tersebut
- Gunakan filter/sort di Excel untuk cek duplikasi
- Jika ada duplikasi, hapus manual dari tabel

---

## 📊 Contoh Template Excel Lengkap

### Template untuk 3 Anggota, 3 Bulan (Okt-Des 2024)

```csv
NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,100000,2024-10,2024-10-18
3201010101010001,Budi Santoso,100000,2024-11,2024-11-18
3201010101010001,Budi Santoso,100000,2024-12,2024-12-02
3201010101010002,Siti Aminah,100000,2024-10,2024-10-18
3201010101010002,Siti Aminah,100000,2024-11,2024-11-18
3201010101010002,Siti Aminah,100000,2024-12,2024-12-02
3201010101010003,Ahmad Yani,100000,2024-10,2024-10-18
3201010101010003,Ahmad Yani,100000,2024-11,2024-11-18
3201010101010003,Ahmad Yani,100000,2024-12,2024-12-02
```

**Hasil:**
- 3 anggota × 3 bulan = 9 transaksi
- Total simpanan wajib: Rp 900.000

---

## 🔒 Jurnal Akuntansi Otomatis

Setiap transaksi simpanan wajib akan otomatis mencatat jurnal:

```
Debit: 1-1000 (Kas) - Rp 100.000
Kredit: 2-1200 (Simpanan Wajib) - Rp 100.000
```

**Keterangan:** Simpanan Wajib - [Nama Anggota]

---

## ❌ Menghapus Data Simpanan Wajib

Jika ada kesalahan input:

1. Cari transaksi di tabel Simpanan Wajib
2. Klik tombol **Hapus** (ikon tempat sampah)
3. Konfirmasi penghapusan
4. Data akan terhapus (jurnal tidak otomatis terhapus)

⚠️ **Catatan:** Penghapusan data tidak otomatis menghapus jurnal. Untuk koreksi jurnal, hubungi admin.

---

## 📞 Troubleshooting

### Problem 1: Upload Gagal - "NIK tidak ditemukan"
**Solusi:**
- Pastikan NIK di file CSV sama persis dengan NIK di Master Anggota
- Cek tidak ada spasi di awal/akhir NIK
- Cek format NIK (angka, bukan teks dengan format khusus)

### Problem 2: Upload Gagal - "Format periode tidak valid"
**Solusi:**
- Gunakan format YYYY-MM (contoh: 2024-10)
- Jangan gunakan format lain (10-2024, Oktober 2024, dll)

### Problem 3: Upload Gagal - "Format tanggal tidak valid"
**Solusi:**
- Gunakan format YYYY-MM-DD (contoh: 2024-10-18)
- Atau format DD/MM/YYYY (contoh: 18/10/2024)
- Pastikan tanggal valid (tidak ada 31 Februari, dll)

### Problem 4: Data Terduplikasi
**Solusi:**
- Hapus manual dari tabel
- Atau export data, filter di Excel, hapus duplikat, upload ulang

---

## 📈 Laporan Simpanan Wajib

Untuk melihat laporan simpanan wajib:

1. **Per Anggota:**
   - Filter tabel berdasarkan nama anggota
   - Lihat riwayat periode yang sudah dibayar

2. **Per Periode:**
   - Filter tabel berdasarkan periode
   - Lihat anggota mana yang sudah/belum bayar

3. **Total:**
   - Lihat footer tabel: Total Simpanan Wajib
   - Ini adalah total akumulasi semua periode

---

## 🎯 Checklist Input Data Historis

Untuk input data sejak Oktober 2024:

- [ ] Download template simpanan wajib
- [ ] Buat file Excel untuk Oktober 2024
- [ ] Isi NIK, Nama, Jumlah (100000), Periode (2024-10), Tanggal (2024-10-18)
- [ ] Upload dan verifikasi preview
- [ ] Proses upload Oktober 2024
- [ ] Ulangi untuk November 2024 (Periode: 2024-11)
- [ ] Ulangi untuk Desember 2024 (Periode: 2024-12)
- [ ] Verifikasi total simpanan wajib di tabel
- [ ] Cek jurnal akuntansi

---

## 📞 Dukungan

Jika ada pertanyaan atau masalah, hubungi administrator sistem.

---

**Terakhir Diperbarui:** 2 Desember 2024  
**Versi:** 1.0.0
