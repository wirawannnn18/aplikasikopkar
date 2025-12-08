# Quick Fix: Anggota Keluar Masih Muncul di Master Anggota

## 🔴 Masalah

Anggota dengan status "Keluar" masih muncul di Master Anggota, padahal seharusnya hanya muncul di menu "Anggota Keluar".

---

## ✅ Solusi Cepat

### Langkah 1: Buat Fungsi Filter (5 menit)

Tambahkan di `js/koperasi.js` setelah fungsi `isValidDate()`:

```javascript
/**
 * Filter anggota to exclude those with statusKeanggotaan === 'Keluar'
 * @param {Array} anggotaList - Array of anggota objects
 * @returns {Array} Filtered array excluding anggota keluar
 */
function filterActiveAnggota(anggotaList) {
    if (!Array.isArray(anggotaList)) {
        return [];
    }
    return anggotaList.filter(a => a.statusKeanggotaan !== 'Keluar');
}

/**
 * Get count of active anggota (excluding keluar)
 * @returns {number} Count of active anggota
 */
function getActiveAnggotaCount() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    return filterActiveAnggota(anggota).length;
}
```

---

### Langkah 2: Update renderAnggota() (2 menit)

Cari fungsi `renderAnggota()` di `js/koperasi.js` (sekitar line 420).

**Ganti:**
```javascript
const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const totalActive = anggota.length;
```

**Dengan:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const anggota = filterActiveAnggota(allAnggota);
const totalActive = anggota.length;
```

---

### Langkah 3: Update renderTableAnggota() (2 menit)

Cari fungsi `renderTableAnggota()` di `js/koperasi.js` (sekitar line 611).

**Ganti:**
```javascript
let anggota = filteredData || JSON.parse(localStorage.getItem('anggota') || '[]');

// No need to filter - anggota keluar already auto-deleted (Task 5.2)
```

**Dengan:**
```javascript
let anggota = filteredData || JSON.parse(localStorage.getItem('anggota') || '[]');

// Filter out anggota keluar from Master Anggota display
// Data is preserved in localStorage for audit purposes
anggota = filterActiveAnggota(anggota);
```

---

### Langkah 4: Update filterAnggota() (2 menit)

Cari fungsi `filterAnggota()` di `js/koperasi.js` (sekitar line 730).

**Ganti:**
```javascript
let anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
```

**Dengan:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
let anggota = filterActiveAnggota(allAnggota);
```

---

### Langkah 5: Update sortAnggotaByDate() (2 menit)

Cari fungsi `sortAnggotaByDate()` di `js/koperasi.js` (sekitar line 800).

**Ganti:**
```javascript
let anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
```

**Dengan:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
let anggota = filterActiveAnggota(allAnggota);
```

---

### Langkah 6: Update Simpanan Dropdowns (3 menit)

Di `js/simpanan.js`, cari dan ganti semua inline filter:

**Ganti:**
```javascript
${anggota.filter(a => a.statusKeanggotaan !== 'Keluar').map(...)}
```

**Dengan:**
```javascript
${filterActiveAnggota(anggota).map(...)}
```

**Lokasi:**
- `renderSimpananPokok()` - line ~20
- `renderSimpananWajib()` - line ~200
- `renderSimpananSukarela()` - line ~400

---

## 🧪 Testing

### Test Manual (2 menit):

1. Buka aplikasi di browser
2. Buat anggota baru dengan nama "Test Aktif"
3. Tandai anggota sebagai "Keluar" via menu Anggota Keluar
4. Kembali ke Master Anggota
5. **Verify:** "Test Aktif" TIDAK muncul di Master Anggota
6. Buka menu "Anggota Keluar"
7. **Verify:** "Test Aktif" MUNCUL di Anggota Keluar

### Test Dropdown (1 menit):

1. Buka menu Simpanan Pokok
2. Klik "Tambah Simpanan Pokok"
3. Lihat dropdown "Pilih Anggota"
4. **Verify:** Anggota keluar TIDAK ada di dropdown

---

## 📊 Hasil yang Diharapkan

### ✅ Setelah Fix:

- Master Anggota hanya menampilkan anggota aktif
- Counter "Total: X Anggota" hanya hitung anggota aktif
- Dropdown simpanan tidak menampilkan anggota keluar
- Filter dan sort bekerja dengan data yang sudah difilter
- Data anggota keluar tetap tersimpan (tidak dihapus)
- Anggota keluar hanya visible di menu "Anggota Keluar"

---

## 🔍 Troubleshooting

### Masalah: Anggota keluar masih muncul

**Solusi:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh halaman (F5)
3. Periksa console untuk error
4. Pastikan semua perubahan sudah disimpan

### Masalah: Dropdown kosong

**Solusi:**
1. Periksa apakah ada anggota aktif di localStorage
2. Buka Console: `JSON.parse(localStorage.getItem('anggota'))`
3. Pastikan ada anggota dengan statusKeanggotaan !== 'Keluar'

### Masalah: Error "filterActiveAnggota is not defined"

**Solusi:**
1. Pastikan fungsi `filterActiveAnggota()` sudah ditambahkan di `js/koperasi.js`
2. Pastikan file sudah disimpan
3. Refresh halaman

---

## 📝 Catatan Penting

1. **Data TIDAK dihapus** - Anggota keluar tetap ada di localStorage
2. **Filtering di display time** - Hanya disembunyikan dari tampilan
3. **Audit trail preserved** - Data historis tetap tersimpan
4. **Rollback mudah** - Tinggal hapus filter function calls

---

## 🚀 Implementasi Lengkap

Untuk implementasi yang lebih comprehensive dengan property-based testing:

1. Baca spec lengkap: `.kiro/specs/filter-anggota-keluar-master/`
2. Ikuti tasks.md untuk step-by-step implementation
3. Jalankan property-based tests untuk verify correctness

---

## ⏱️ Total Waktu: ~15 menit

- Langkah 1: 5 menit
- Langkah 2-5: 8 menit
- Langkah 6: 3 menit
- Testing: 3 menit

**Total: ~19 menit untuk fix lengkap**

---

## 📞 Butuh Bantuan?

Jika ada masalah atau pertanyaan:
1. Baca SPEC_FILTER_ANGGOTA_KELUAR_MASTER.md untuk detail lengkap
2. Buka `.kiro/specs/filter-anggota-keluar-master/design.md` untuk penjelasan teknis
3. Tanya Kiro untuk bantuan implementasi

---

**Status:** ✅ QUICK FIX READY
**Estimated Time:** 15-20 minutes
**Difficulty:** Easy
