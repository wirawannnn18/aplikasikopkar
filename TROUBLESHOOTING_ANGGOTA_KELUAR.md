# Troubleshooting: Anggota Keluar Masih Belum Bisa

## Langkah-Langkah Debug

### 1. Buka Browser Console
1. Tekan **F12** atau **Ctrl+Shift+I**
2. Pilih tab **Console**
3. Refresh halaman (F5)
4. Lihat apakah ada error merah

### 2. Cek Error yang Mungkin Terjadi

#### Error A: "validatePengembalian is not defined"
**Penyebab:** Script tidak ter-load dengan benar

**Solusi:**
1. Buka `index.html`
2. Pastikan urutan script benar:
```html
<script src="js/anggotaKeluarRepository.js"></script>
<script src="js/anggotaKeluarManager.js"></script>
<script src="js/anggotaKeluarSecurity.js"></script>
<script src="js/anggotaKeluarValidation.js"></script>
<script src="js/anggotaKeluarUI.js"></script>
```
3. Hard refresh: **Ctrl+F5**

#### Error B: "Saldo kas tidak mencukupi" (masih ERROR)
**Penyebab:** Browser cache masih menyimpan kode lama

**Solusi:**
1. **Hard Refresh:** Tekan **Ctrl+Shift+R** atau **Ctrl+F5**
2. **Clear Cache:**
   - Chrome: Settings > Privacy > Clear browsing data > Cached images
   - Firefox: Ctrl+Shift+Delete > Cache
3. **Incognito Mode:** Buka di mode incognito/private
4. Refresh lagi

#### Error C: Tombol "Anggota Keluar" tidak muncul
**Penyebab:** Role/permission atau UI tidak ter-render

**Solusi:**
1. Cek role user di localStorage:
```javascript
// Paste di Console
console.log(JSON.parse(localStorage.getItem('currentUser')));
```
2. Pastikan role adalah `administrator` atau `super_admin`
3. Refresh halaman Master Anggota

#### Error D: Modal tidak muncul setelah klik
**Penyebab:** Bootstrap atau event handler error

**Solusi:**
1. Cek console untuk error
2. Pastikan Bootstrap JS ter-load:
```javascript
// Paste di Console
console.log(typeof bootstrap);
// Harus return "object"
```

### 3. Test dengan File Debug

Buka file ini di browser untuk test:
```
test_debug_anggota_keluar.html
```

Klik tombol-tombol test dan lihat output di console.

### 4. Test Manual Step-by-Step

#### Test 1: Cek Fungsi Tersedia
Paste di Console:
```javascript
console.log('markAnggotaKeluar:', typeof markAnggotaKeluar);
console.log('validatePengembalian:', typeof validatePengembalian);
console.log('generateBuktiAnggotaKeluar:', typeof generateBuktiAnggotaKeluar);
```

**Expected:** Semua harus return `"function"`

#### Test 2: Setup Test Data
Paste di Console:
```javascript
// Setup test anggota
const testAnggota = {
    id: 'test-debug-001',
    nik: '1234567890123456',
    nama: 'Test Debug User',
    departemen: 'IT',
    statusKeanggotaan: 'Aktif'
};

let anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
anggotaList.push(testAnggota);
localStorage.setItem('anggota', JSON.stringify(anggotaList));

// Setup simpanan
localStorage.setItem('simpananPokok', JSON.stringify([
    { id: 'sp-test', anggotaId: 'test-debug-001', jumlah: 500000 }
]));

localStorage.setItem('simpananWajib', JSON.stringify([
    { id: 'sw-test', anggotaId: 'test-debug-001', jumlah: 100000 }
]));

console.log('✅ Test data created');
```

#### Test 3: Test Validasi (Harus WARNING, bukan ERROR)
Paste di Console:
```javascript
const validation = validatePengembalian('test-debug-001', 'Kas');
console.log('Validation Result:', validation);
console.log('Valid?', validation.valid);
console.log('Errors:', validation.errors.length);
console.log('Warnings:', validation.warnings.length);

if (validation.valid && validation.warnings.length > 0) {
    console.log('✅ CORRECT: Validation returns valid=true with warnings');
} else if (!validation.valid) {
    console.log('❌ WRONG: Validation returns valid=false (should be true with warnings)');
}
```

**Expected Output:**
```
Valid? true
Errors: 0
Warnings: 1 (atau lebih)
✅ CORRECT: Validation returns valid=true with warnings
```

#### Test 4: Test Mark Keluar
Paste di Console:
```javascript
const result = markAnggotaKeluar('test-debug-001', '2024-12-05', 'Test debug');
console.log('Mark Keluar Result:', result);

if (result.success) {
    console.log('✅ Mark keluar successful');
} else {
    console.log('❌ Mark keluar failed:', result.error.message);
}
```

#### Test 5: Test Generate Bukti
Paste di Console:
```javascript
// First mark as keluar if not already
markAnggotaKeluar('test-debug-001', '2024-12-05', 'Test debug');

// Then generate bukti
const bukti = generateBuktiAnggotaKeluar('test-debug-001');
console.log('Bukti Result:', bukti);

if (bukti.success) {
    console.log('✅ Bukti generated');
    console.log('Nomor Referensi:', bukti.data.nomorReferensi);
    
    // Open in new window
    const w = window.open('', '_blank');
    w.document.write(bukti.data.html);
    w.document.close();
} else {
    console.log('❌ Bukti failed:', bukti.error.message);
}
```

### 5. Cek Versi File

Pastikan file sudah ter-update dengan perubahan terbaru:

#### Cek js/anggotaKeluarManager.js
Paste di Console:
```javascript
fetch('js/anggotaKeluarManager.js')
    .then(r => r.text())
    .then(text => {
        if (text.includes('validationWarnings.push')) {
            console.log('✅ File sudah ter-update (WARNING version)');
        } else if (text.includes('validationErrors.push')) {
            console.log('❌ File masih versi lama (ERROR version)');
            console.log('⚠️ Lakukan hard refresh: Ctrl+Shift+R');
        }
    });
```

### 6. Solusi Cepat: Force Reload

Jika masih tidak bisa, coba langkah ini:

1. **Tutup semua tab browser**
2. **Buka Task Manager** (Ctrl+Shift+Esc)
3. **Kill semua proses browser**
4. **Buka browser lagi**
5. **Buka aplikasi**
6. **Hard refresh:** Ctrl+Shift+R

### 7. Cek Specific Error Messages

#### Jika muncul: "Anggota memiliki X pinjaman aktif"
- Ini adalah validasi yang benar (ERROR)
- Lunasi pinjaman dulu atau hapus data pinjaman test

#### Jika muncul: "Saldo kas tidak mencukupi" dengan tombol disabled
- ❌ Ini masalah - seharusnya WARNING dengan tombol enabled
- Lakukan hard refresh (Ctrl+Shift+R)
- Cek versi file dengan langkah #5

#### Jika muncul: "Metode pembayaran harus dipilih"
- Ini validasi yang benar
- Pilih "Kas" atau "Transfer Bank"

### 8. Screenshot Error

Jika masih bermasalah, ambil screenshot:
1. **Console tab** (F12) - tampilkan semua error merah
2. **Network tab** - tampilkan file yang gagal load (merah)
3. **Application tab > Local Storage** - tampilkan data anggota

### 9. Test di Browser Lain

Coba buka di browser berbeda:
- Chrome
- Firefox
- Edge

Jika berfungsi di browser lain = masalah cache browser pertama

### 10. Reinstall/Re-download

Jika semua gagal:
1. Backup data: Export localStorage
2. Download ulang file terbaru
3. Replace file lama
4. Restore data

## Quick Checklist

Centang yang sudah dicoba:

- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Clear browser cache
- [ ] Buka di incognito mode
- [ ] Cek console untuk error
- [ ] Test dengan test_debug_anggota_keluar.html
- [ ] Cek versi file (langkah #5)
- [ ] Test di browser lain
- [ ] Kill dan restart browser
- [ ] Cek role user (administrator/super_admin)

## Kontak

Jika masih bermasalah setelah semua langkah di atas, berikan informasi:
1. Browser dan versi (Chrome 120, Firefox 121, dll)
2. Screenshot console error
3. Hasil dari test langkah #3 (paste output)
4. Hasil dari cek versi file langkah #5

---

**Update:** 5 Desember 2024  
**Status:** Troubleshooting Guide
