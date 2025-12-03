# Panduan Input Tanggal Pendaftaran Historis

## 📋 Deskripsi

Fitur ini memungkinkan admin untuk memasukkan tanggal pendaftaran anggota secara manual, terutama untuk **data historis** koperasi yang sudah berjalan sebelum menggunakan aplikasi ini.

## 🎯 Kegunaan

Aplikasi ini dibuat untuk koperasi yang **sudah berjalan sejak 18 Oktober 2024**. Oleh karena itu, saat memasukkan data anggota lama, Anda perlu mengisi tanggal pendaftaran asli mereka (bukan tanggal hari ini).

## ✅ Perubahan yang Dilakukan

### Sebelum:
- ❌ Tanggal pendaftaran **readonly** (tidak bisa diubah)
- ❌ Otomatis terisi tanggal hari ini
- ❌ Tidak bisa input tanggal historis

### Sesudah:
- ✅ Tanggal pendaftaran **bisa diedit**
- ✅ Bisa input tanggal historis (sebelum hari ini)
- ✅ Default tetap tanggal hari ini untuk anggota baru
- ✅ Bisa diubah saat edit anggota

## 📝 Cara Menggunakan

### 1. Tambah Anggota Baru

1. Buka menu **Master Anggota**
2. Klik tombol **"Tambah Anggota"**
3. Isi semua data anggota
4. **Pada field "Tanggal Pendaftaran":**
   - Untuk anggota baru (hari ini): Biarkan default (tanggal hari ini)
   - Untuk data historis: Ubah ke tanggal pendaftaran asli anggota
5. Klik **"Simpan"**

### 2. Edit Anggota Existing

1. Buka menu **Master Anggota**
2. Klik tombol **"Edit"** (ikon pensil) pada anggota yang ingin diubah
3. Ubah tanggal pendaftaran sesuai kebutuhan
4. Klik **"Simpan"**

## 💡 Contoh Kasus Penggunaan

### Kasus 1: Input Anggota Lama (Data Historis)

**Situasi:** Pak Budi sudah menjadi anggota koperasi sejak **18 Oktober 2024**, tapi baru diinput ke sistem pada **2 Desember 2024**.

**Langkah:**
1. Tambah anggota baru dengan nama "Pak Budi"
2. Pada field "Tanggal Pendaftaran", ubah dari `02/12/2024` menjadi `18/10/2024`
3. Simpan

**Hasil:** Sistem akan mencatat Pak Budi sebagai anggota sejak 18 Oktober 2024.

---

### Kasus 2: Input Anggota Baru (Hari Ini)

**Situasi:** Bu Ani baru mendaftar sebagai anggota hari ini (**2 Desember 2024**).

**Langkah:**
1. Tambah anggota baru dengan nama "Bu Ani"
2. Pada field "Tanggal Pendaftaran", biarkan default (sudah terisi tanggal hari ini)
3. Simpan

**Hasil:** Sistem akan mencatat Bu Ani sebagai anggota sejak 2 Desember 2024.

---

### Kasus 3: Koreksi Tanggal Pendaftaran

**Situasi:** Tanggal pendaftaran Pak Joko salah diinput sebagai **1 November 2024**, padahal seharusnya **18 Oktober 2024**.

**Langkah:**
1. Cari anggota "Pak Joko" di daftar
2. Klik tombol "Edit"
3. Ubah tanggal pendaftaran dari `01/11/2024` menjadi `18/10/2024`
4. Simpan

**Hasil:** Tanggal pendaftaran Pak Joko terkoreksi menjadi 18 Oktober 2024.

## 🔍 Format Tanggal

- **Input:** Menggunakan date picker (format: YYYY-MM-DD)
- **Tampilan:** Format Indonesia (DD/MM/YYYY)
- **Contoh:**
  - Input: `2024-10-18`
  - Tampilan di tabel: `18/10/2024`

## ⚠️ Validasi

Sistem akan memvalidasi:
- ✅ Tanggal tidak boleh kosong
- ✅ Tanggal harus valid (tidak boleh 31 Februari, dll)
- ✅ Tanggal tidak boleh di masa depan
- ✅ Tanggal tidak boleh sebelum tahun 1900

## 📊 Fitur Filter Berdasarkan Tanggal

Anda juga bisa memfilter anggota berdasarkan rentang tanggal pendaftaran:

1. Di halaman **Master Anggota**, gunakan filter:
   - **Tanggal Pendaftaran Dari:** Tanggal awal
   - **Tanggal Pendaftaran Sampai:** Tanggal akhir
2. Sistem akan menampilkan anggota yang terdaftar dalam rentang tersebut

**Contoh:**
- Dari: `18/10/2024`
- Sampai: `31/10/2024`
- Hasil: Menampilkan semua anggota yang terdaftar antara 18-31 Oktober 2024

## 🎯 Tips untuk Admin

### Saat Migrasi Data Awal:

1. **Siapkan daftar anggota lama** dengan tanggal pendaftaran asli mereka
2. **Input satu per satu** atau gunakan fitur **Import Data** (jika tersedia)
3. **Pastikan tanggal akurat** untuk keperluan laporan dan audit
4. **Verifikasi data** setelah input dengan menggunakan filter tanggal

### Untuk Anggota Baru:

1. **Biarkan default** tanggal hari ini
2. Sistem akan otomatis mengisi tanggal pendaftaran
3. Tidak perlu mengubah kecuali ada kebutuhan khusus

## 📌 Catatan Penting

- ✅ Tanggal pendaftaran **sekarang bisa diubah** untuk fleksibilitas data historis
- ✅ Perubahan ini **tidak mempengaruhi** data yang sudah ada
- ✅ Tanggal pendaftaran tetap **required** (wajib diisi)
- ✅ Untuk integritas data, **catat perubahan** tanggal pendaftaran jika diperlukan

## 🔒 Keamanan Data

Meskipun tanggal pendaftaran bisa diubah, disarankan untuk:

1. **Hanya admin** yang boleh mengubah tanggal pendaftaran
2. **Dokumentasikan** setiap perubahan tanggal untuk audit trail
3. **Verifikasi** dengan dokumen fisik jika mengubah data historis
4. **Backup data** secara berkala

## 📞 Dukungan

Jika ada pertanyaan atau masalah terkait input tanggal pendaftaran, hubungi administrator sistem.

---

**Terakhir Diperbarui:** 2 Desember 2024  
**Versi:** 1.0.0
