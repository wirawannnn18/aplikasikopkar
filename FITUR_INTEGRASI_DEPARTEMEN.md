# Fitur Integrasi Master Departemen dengan Master Anggota

## Deskripsi
Fitur ini menghubungkan data departemen di Master Departemen dengan Master Anggota, sehingga kedua modul saling terintegrasi dan data konsisten.

## Fitur yang Ditambahkan

### 1. **Dropdown Departemen Dinamis**
- Dropdown departemen di form anggota sekarang mengambil data dari Master Departemen
- Hanya menampilkan departemen yang berstatus **Aktif**
- Otomatis diurutkan berdasarkan nama departemen
- Format tampilan: `Nama Departemen (KODE)`

### 2. **Filter Departemen Dinamis**
- Filter departemen di halaman Master Anggota menggunakan data dari Master Departemen
- Memudahkan pencarian anggota berdasarkan departemen yang terdaftar

### 3. **Link Antar Halaman**

#### Dari Master Departemen ke Master Anggota:
- Tombol **Lihat Anggota** (ikon people) di tabel departemen
- Klik tombol akan membuka halaman Master Anggota dengan filter departemen otomatis
- Menampilkan jumlah anggota di setiap departemen

#### Dari Master Anggota ke Master Departemen:
- Link di detail anggota untuk melihat departemen mereka
- Klik link akan membuka halaman Master Departemen dan menampilkan detail departemen

### 4. **Widget Departemen di Dashboard**
- Menampilkan 5 departemen teratas berdasarkan jumlah anggota
- Menampilkan total departemen yang terdaftar
- Link ke halaman Master Departemen

### 5. **Validasi dan Peringatan**

#### Saat Edit Anggota:
- Peringatan jika departemen anggota tidak ditemukan di master
- Peringatan jika departemen anggota sudah nonaktif
- Saran untuk memindahkan ke departemen lain

#### Saat Hapus Departemen:
- Tidak bisa menghapus departemen yang masih memiliki anggota
- Menampilkan jumlah anggota yang terdaftar

### 6. **Auto-Update Nama Departemen**
- Saat nama departemen diubah di Master Departemen
- Otomatis mengupdate nama departemen di semua data anggota
- Memastikan konsistensi data

### 7. **Link Helper di Form**
- Link "Kelola departemen di Master Departemen" di form anggota
- Memudahkan admin untuk menambah departemen baru

## Cara Penggunaan

### Menambah Departemen Baru
1. Buka menu **Master Departemen**
2. Klik tombol **Tambah Departemen**
3. Isi data:
   - Kode Departemen (contoh: IT, HR, FIN)
   - Nama Departemen (contoh: Information Technology)
   - Keterangan (opsional)
   - Status (Aktif/Nonaktif)
4. Klik **Simpan**

### Menambah Anggota dengan Departemen
1. Buka menu **Master Anggota**
2. Klik tombol **Tambah Anggota**
3. Pilih departemen dari dropdown (hanya departemen aktif yang muncul)
4. Jika departemen belum ada, klik link "Kelola departemen di Master Departemen"
5. Lengkapi data anggota lainnya
6. Klik **Simpan**

### Melihat Anggota per Departemen
1. Buka menu **Master Departemen**
2. Klik tombol **Lihat Anggota** (ikon people) di departemen yang diinginkan
3. Otomatis pindah ke halaman Master Anggota dengan filter departemen aktif

### Melihat Detail Departemen dari Anggota
1. Buka menu **Master Anggota**
2. Klik tombol **Detail** (ikon mata) pada anggota
3. Klik link di samping nama departemen
4. Otomatis pindah ke halaman Master Departemen dan menampilkan detail

### Mengubah Nama Departemen
1. Buka menu **Master Departemen**
2. Klik tombol **Edit** pada departemen
3. Ubah nama departemen
4. Klik **Simpan**
5. Sistem otomatis mengupdate nama departemen di semua data anggota

## Validasi dan Keamanan

### Validasi Kode Departemen
- Kode departemen harus unik
- Otomatis diubah ke huruf kapital
- Tidak boleh kosong

### Validasi Hapus Departemen
- Tidak bisa menghapus departemen yang masih memiliki anggota
- Menampilkan pesan error dengan jumlah anggota

### Validasi Edit Anggota
- Peringatan jika departemen tidak valid
- Peringatan jika departemen nonaktif
- Tetap bisa menyimpan dengan departemen lama

## Statistik dan Laporan

### Dashboard
- Widget departemen menampilkan 5 departemen teratas
- Diurutkan berdasarkan jumlah anggota terbanyak
- Total departemen yang terdaftar

### Master Departemen
- Jumlah anggota per departemen di tabel
- Jumlah anggota di detail departemen
- Link langsung ke daftar anggota

### Master Anggota
- Filter berdasarkan departemen
- Pencarian berdasarkan departemen
- Badge departemen di tabel

## Tips Penggunaan

1. **Buat Departemen Terlebih Dahulu**
   - Sebelum menambah anggota, pastikan departemen sudah dibuat
   - Gunakan kode yang singkat dan mudah diingat

2. **Gunakan Status Aktif/Nonaktif**
   - Nonaktifkan departemen yang sudah tidak digunakan
   - Jangan hapus departemen yang pernah memiliki anggota

3. **Manfaatkan Link Antar Halaman**
   - Gunakan tombol "Lihat Anggota" untuk cek anggota per departemen
   - Gunakan link di detail anggota untuk cek info departemen

4. **Perhatikan Peringatan**
   - Baca peringatan saat edit anggota dengan departemen nonaktif
   - Pindahkan anggota ke departemen aktif jika diperlukan

## Troubleshooting

### Departemen Tidak Muncul di Dropdown
- Pastikan departemen berstatus **Aktif**
- Refresh halaman Master Anggota
- Cek di Master Departemen apakah data sudah tersimpan

### Tidak Bisa Hapus Departemen
- Cek jumlah anggota di departemen tersebut
- Pindahkan semua anggota ke departemen lain terlebih dahulu
- Atau ubah status menjadi **Nonaktif** tanpa menghapus

### Nama Departemen Tidak Terupdate di Anggota
- Pastikan menggunakan fungsi Edit di Master Departemen
- Jangan mengubah data departemen secara manual di localStorage
- Refresh halaman Master Anggota setelah update

## File yang Dimodifikasi

1. **js/departemen.js** (baru)
   - Modul lengkap untuk Master Departemen
   - Fungsi CRUD departemen
   - Fungsi link ke Master Anggota

2. **js/koperasi.js**
   - Fungsi `getDepartemenOptions()` untuk dropdown dinamis
   - Fungsi `lihatDepartemenDetail()` untuk link ke departemen
   - Validasi departemen saat edit anggota

3. **js/auth.js**
   - Fungsi `getDashboardDepartemenWidget()` untuk widget dashboard
   - Update renderDashboard dengan widget departemen

4. **js/app.js**
   - Inisialisasi localStorage untuk departemen

5. **index.html**
   - Tambah script departemen.js

## Manfaat Integrasi

1. **Konsistensi Data**
   - Data departemen terpusat di satu tempat
   - Perubahan nama departemen otomatis terupdate

2. **Kemudahan Navigasi**
   - Link antar halaman memudahkan eksplorasi data
   - Filter otomatis saat pindah halaman

3. **Validasi Otomatis**
   - Mencegah data tidak valid
   - Peringatan untuk data yang bermasalah

4. **Statistik Real-time**
   - Jumlah anggota per departemen selalu update
   - Widget dashboard menampilkan data terkini

5. **User Experience**
   - Dropdown dinamis lebih user-friendly
   - Link helper memudahkan admin
   - Navigasi intuitif antar modul
