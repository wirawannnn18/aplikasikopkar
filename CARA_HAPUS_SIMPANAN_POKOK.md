# Cara Menghapus Semua Data Simpanan Pokok

Ada 3 cara untuk menghapus semua data simpanan pokok dari aplikasi:

## Cara 1: Menggunakan Halaman Utility (Paling Mudah)

1. Buka file `hapus_simpanan_pokok.html` di browser
2. Lihat jumlah data simpanan pokok yang ada
3. Klik tombol **"Hapus Semua Data Simpanan Pokok"**
4. Konfirmasi penghapusan (akan ada 2 konfirmasi untuk keamanan)
5. Data berhasil dihapus!

## Cara 2: Menggunakan Browser Console

1. Buka aplikasi di browser
2. Tekan `F12` atau `Ctrl+Shift+I` untuk membuka Developer Tools
3. Pilih tab **Console**
4. Copy dan paste script berikut, lalu tekan Enter:

```javascript
// Cek jumlah data sebelum dihapus
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
console.log('Jumlah data simpanan pokok:', simpananPokok.length);

// Hapus semua data simpanan pokok
localStorage.removeItem('simpananPokok');
// Atau set ke array kosong
localStorage.setItem('simpananPokok', JSON.stringify([]));

console.log('✅ Semua data simpanan pokok berhasil dihapus!');

// Cek jumlah data setelah dihapus
const simpananPokokBaru = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
console.log('Jumlah data simpanan pokok sekarang:', simpananPokokBaru.length);
```

5. Refresh halaman aplikasi untuk melihat perubahan

## Cara 3: Menggunakan Menu Aplikasi (Jika Tersedia)

Jika aplikasi memiliki fitur hapus data:

1. Login ke aplikasi
2. Buka menu **Simpanan** → **Simpanan Pokok**
3. Cari tombol atau menu untuk menghapus semua data
4. Konfirmasi penghapusan

## Script Lengkap untuk Console

Jika Anda ingin script yang lebih lengkap dengan konfirmasi:

```javascript
(function() {
    // Cek jumlah data
    const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    const jumlah = simpananPokok.length;
    
    console.log('=================================');
    console.log('HAPUS SEMUA DATA SIMPANAN POKOK');
    console.log('=================================');
    console.log('Jumlah data saat ini:', jumlah);
    
    if (jumlah === 0) {
        console.log('❌ Tidak ada data simpanan pokok untuk dihapus.');
        return;
    }
    
    // Konfirmasi
    const konfirmasi = confirm(
        `Anda akan menghapus ${jumlah} data simpanan pokok.\n\n` +
        'Data yang dihapus TIDAK DAPAT dikembalikan!\n\n' +
        'Apakah Anda yakin ingin melanjutkan?'
    );
    
    if (!konfirmasi) {
        console.log('❌ Penghapusan dibatalkan.');
        return;
    }
    
    // Hapus data
    localStorage.removeItem('simpananPokok');
    localStorage.setItem('simpananPokok', JSON.stringify([]));
    
    // Verifikasi
    const simpananPokokBaru = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    
    console.log('✅ Berhasil menghapus semua data simpanan pokok!');
    console.log('Jumlah data sekarang:', simpananPokokBaru.length);
    console.log('=================================');
    
    // Refresh halaman
    const refresh = confirm('Refresh halaman untuk melihat perubahan?');
    if (refresh) {
        location.reload();
    }
})();
```

## Backup Data Sebelum Menghapus

Jika Anda ingin backup data sebelum menghapus:

```javascript
// Backup data simpanan pokok
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
const backup = JSON.stringify(simpananPokok, null, 2);

// Download backup sebagai file JSON
const blob = new Blob([backup], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `backup_simpanan_pokok_${new Date().toISOString().split('T')[0]}.json`;
a.click();

console.log('✅ Backup berhasil didownload!');
console.log('Jumlah data yang dibackup:', simpananPokok.length);
```

## Restore Data dari Backup

Jika Anda ingin restore data dari backup:

```javascript
// Paste data backup di sini (dalam format array JSON)
const backupData = [
    // ... data backup Anda
];

// Restore ke localStorage
localStorage.setItem('simpananPokok', JSON.stringify(backupData));

console.log('✅ Data berhasil direstore!');
console.log('Jumlah data yang direstore:', backupData.length);

// Refresh halaman
location.reload();
```

## Peringatan

⚠️ **PENTING:**
- Data yang sudah dihapus **TIDAK DAPAT** dikembalikan
- Pastikan Anda sudah backup data jika diperlukan
- Penghapusan hanya mempengaruhi data simpanan pokok
- Data lain (anggota, simpanan wajib, simpanan sukarela) tetap aman
- Jurnal yang sudah tercatat tidak akan terhapus

## Verifikasi Penghapusan

Untuk memastikan data sudah terhapus:

```javascript
// Cek data simpanan pokok
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
console.log('Jumlah data simpanan pokok:', simpananPokok.length);
console.log('Data:', simpananPokok);
```

## Troubleshooting

### Data Tidak Terhapus
- Pastikan Anda menjalankan script di tab yang benar
- Refresh halaman setelah menghapus
- Cek apakah ada error di console

### Data Muncul Lagi Setelah Refresh
- Mungkin ada proses yang me-restore data
- Cek apakah ada script yang mengisi data default
- Pastikan tidak ada sinkronisasi dari server

### Ingin Menghapus Data Lain Juga
Untuk menghapus data simpanan lainnya:

```javascript
// Hapus simpanan wajib
localStorage.removeItem('simpananWajib');
localStorage.setItem('simpananWajib', JSON.stringify([]));

// Hapus simpanan sukarela
localStorage.removeItem('simpananSukarela');
localStorage.setItem('simpananSukarela', JSON.stringify([]));

console.log('✅ Semua data simpanan berhasil dihapus!');
```

## Kontak Support

Jika mengalami masalah, hubungi:
- Email: support@koperasi.com
- WhatsApp: +62 812-3456-7890
