# Perbaikan: Laporan Simpanan untuk Anggota Keluar

## Masalah

Ketika anggota ditandai keluar dan pengembalian simpanan sudah diproses:
- ❌ Simpanan masih muncul di laporan simpanan
- ❌ Total simpanan tidak akurat
- ❌ Tidak ada dampak ke accounting sampai pengembalian diproses

## Solusi

Saya telah menambahkan fungsi-fungsi baru yang secara otomatis mengecualikan simpanan anggota yang sudah keluar dan sudah diproses pengembaliannya.

---

## Fungsi Baru yang Ditambahkan

### 1. `getTotalSimpananPokokForLaporan(anggotaId, excludeProcessedKeluar = true)`

Menghitung total simpanan pokok untuk laporan, dengan opsi mengecualikan anggota keluar yang sudah diproses.

**Parameter:**
- `anggotaId` - ID anggota
- `excludeProcessedKeluar` - Default `true`, set `false` untuk tetap hitung anggota keluar

**Return:** Number - Total simpanan pokok

**Contoh:**
```javascript
// Untuk laporan (exclude anggota keluar yang sudah diproses)
const total = getTotalSimpananPokokForLaporan('anggota-001');

// Untuk perhitungan internal (include semua)
const totalAll = getTotalSimpananPokokForLaporan('anggota-001', false);
```

### 2. `getTotalSimpananWajibForLaporan(anggotaId, excludeProcessedKeluar = true)`

Menghitung total simpanan wajib untuk laporan, dengan opsi mengecualikan anggota keluar yang sudah diproses.

**Parameter:**
- `anggotaId` - ID anggota
- `excludeProcessedKeluar` - Default `true`, set `false` untuk tetap hitung anggota keluar

**Return:** Number - Total simpanan wajib

**Contoh:**
```javascript
// Untuk laporan (exclude anggota keluar yang sudah diproses)
const total = getTotalSimpananWajibForLaporan('anggota-001');
```

### 3. `getAnggotaWithSimpananForLaporan()`

Mendapatkan semua anggota dengan total simpanan mereka, otomatis mengecualikan anggota keluar yang sudah diproses pengembaliannya.

**Return:** Array - Daftar anggota dengan simpanan

**Contoh:**
```javascript
const anggotaList = getAnggotaWithSimpananForLaporan();

anggotaList.forEach(anggota => {
    console.log(`${anggota.nama}: Rp ${anggota.totalSimpanan.toLocaleString('id-ID')}`);
});
```

---

## Cara Menggunakan di Laporan Simpanan

### Opsi 1: Update Fungsi Laporan Existing

Jika Anda sudah punya fungsi laporan simpanan, update untuk menggunakan fungsi baru:

**SEBELUM:**
```javascript
function renderLaporanSimpanan() {
    const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    anggotaList.forEach(anggota => {
        const simpananPokok = getTotalSimpananPokok(anggota.id);
        const simpananWajib = getTotalSimpananWajib(anggota.id);
        // ... render
    });
}
```

**SESUDAH:**
```javascript
function renderLaporanSimpanan() {
    // Gunakan fungsi baru yang otomatis exclude anggota keluar
    const anggotaList = getAnggotaWithSimpananForLaporan();
    
    anggotaList.forEach(anggota => {
        // simpananPokok dan simpananWajib sudah ter-calculate
        console.log(anggota.simpananPokok, anggota.simpananWajib);
        // ... render
    });
}
```

### Opsi 2: Filter Manual

Jika ingin kontrol lebih detail:

```javascript
function renderLaporanSimpanan() {
    const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    anggotaList.forEach(anggota => {
        // Cek apakah anggota keluar dan sudah diproses
        const isProcessedKeluar = anggota.statusKeanggotaan === 'Keluar' && 
                                  anggota.pengembalianStatus === 'Selesai';
        
        if (isProcessedKeluar) {
            // Skip anggota ini di laporan
            return;
        }
        
        // Atau tampilkan dengan saldo 0
        const simpananPokok = isProcessedKeluar ? 0 : getTotalSimpananPokok(anggota.id);
        const simpananWajib = isProcessedKeluar ? 0 : getTotalSimpananWajib(anggota.id);
        
        // ... render
    });
}
```

---

## Logika Bisnis

### Status Anggota dan Dampak ke Laporan

| Status Anggota | Pengembalian Status | Muncul di Laporan? | Saldo Simpanan |
|----------------|---------------------|-------------------|----------------|
| Aktif | - | ✅ Ya | Penuh |
| Keluar | Pending | ✅ Ya | Penuh |
| Keluar | Diproses | ✅ Ya | Penuh |
| Keluar | Selesai | ❌ Tidak | 0 |

**Penjelasan:**
- **Aktif:** Anggota normal, simpanan dihitung penuh
- **Keluar + Pending:** Baru ditandai keluar, belum diproses pengembalian, simpanan masih ada
- **Keluar + Diproses:** Sedang diproses pengembalian, simpanan masih ada
- **Keluar + Selesai:** Pengembalian sudah selesai, simpanan sudah ditarik, tidak muncul di laporan

### Timeline Proses

```
1. Tandai Anggota Keluar
   ↓
   Status: Keluar + Pending
   Laporan: Masih muncul dengan saldo penuh
   Accounting: Belum ada jurnal
   
2. Proses Pengembalian
   ↓
   Status: Keluar + Selesai
   Laporan: TIDAK muncul (saldo 0)
   Accounting: Jurnal pengembalian tercatat
   
   Jurnal yang dibuat:
   - Debit: Simpanan Pokok (2-1100)
   - Debit: Simpanan Wajib (2-1200)
   - Kredit: Kas/Bank (1-1000/1-1100)
```

---

## Testing

### Test 1: Anggota Aktif
```javascript
// Setup
const anggota = {
    id: 'test-001',
    nama: 'Test User',
    statusKeanggotaan: 'Aktif'
};
localStorage.setItem('anggota', JSON.stringify([anggota]));
localStorage.setItem('simpananPokok', JSON.stringify([
    { id: 'sp1', anggotaId: 'test-001', jumlah: 500000 }
]));

// Test
const total = getTotalSimpananPokokForLaporan('test-001');
console.log(total); // Expected: 500000

const list = getAnggotaWithSimpananForLaporan();
console.log(list.length); // Expected: 1
console.log(list[0].simpananPokok); // Expected: 500000
```

### Test 2: Anggota Keluar (Pending)
```javascript
// Setup
const anggota = {
    id: 'test-002',
    nama: 'Test User 2',
    statusKeanggotaan: 'Keluar',
    pengembalianStatus: 'Pending'
};
localStorage.setItem('anggota', JSON.stringify([anggota]));
localStorage.setItem('simpananPokok', JSON.stringify([
    { id: 'sp2', anggotaId: 'test-002', jumlah: 500000 }
]));

// Test
const total = getTotalSimpananPokokForLaporan('test-002');
console.log(total); // Expected: 500000 (masih muncul)

const list = getAnggotaWithSimpananForLaporan();
console.log(list.length); // Expected: 1 (masih muncul)
```

### Test 3: Anggota Keluar (Selesai)
```javascript
// Setup
const anggota = {
    id: 'test-003',
    nama: 'Test User 3',
    statusKeanggotaan: 'Keluar',
    pengembalianStatus: 'Selesai'
};
localStorage.setItem('anggota', JSON.stringify([anggota]));
localStorage.setItem('simpananPokok', JSON.stringify([
    { id: 'sp3', anggotaId: 'test-003', jumlah: 500000 }
]));

// Test
const total = getTotalSimpananPokokForLaporan('test-003');
console.log(total); // Expected: 0 (sudah ditarik)

const list = getAnggotaWithSimpananForLaporan();
console.log(list.length); // Expected: 0 (tidak muncul)
```

---

## Implementasi di File Laporan

### Contoh: Laporan Simpanan Pokok

```javascript
function renderLaporanSimpananPokok() {
    const anggotaList = getAnggotaWithSimpananForLaporan();
    
    let html = '<table class="table">';
    html += '<thead><tr><th>NIK</th><th>Nama</th><th>Simpanan Pokok</th></tr></thead>';
    html += '<tbody>';
    
    let grandTotal = 0;
    
    anggotaList.forEach(anggota => {
        html += `<tr>`;
        html += `<td>${anggota.nik}</td>`;
        html += `<td>${anggota.nama}</td>`;
        html += `<td class="text-end">Rp ${anggota.simpananPokok.toLocaleString('id-ID')}</td>`;
        html += `</tr>`;
        
        grandTotal += anggota.simpananPokok;
    });
    
    html += `<tr class="table-dark"><td colspan="2"><strong>TOTAL</strong></td>`;
    html += `<td class="text-end"><strong>Rp ${grandTotal.toLocaleString('id-ID')}</strong></td></tr>`;
    html += '</tbody></table>';
    
    return html;
}
```

### Contoh: Laporan Simpanan Wajib

```javascript
function renderLaporanSimpananWajib() {
    const anggotaList = getAnggotaWithSimpananForLaporan();
    
    let html = '<table class="table">';
    html += '<thead><tr><th>NIK</th><th>Nama</th><th>Simpanan Wajib</th></tr></thead>';
    html += '<tbody>';
    
    let grandTotal = 0;
    
    anggotaList.forEach(anggota => {
        html += `<tr>`;
        html += `<td>${anggota.nik}</td>`;
        html += `<td>${anggota.nama}</td>`;
        html += `<td class="text-end">Rp ${anggota.simpananWajib.toLocaleString('id-ID')}</td>`;
        html += `</tr>`;
        
        grandTotal += anggota.simpananWajib;
    });
    
    html += `<tr class="table-dark"><td colspan="2"><strong>TOTAL</strong></td>`;
    html += `<td class="text-end"><strong>Rp ${grandTotal.toLocaleString('id-ID')}</strong></td></tr>`;
    html += '</tbody></table>';
    
    return html;
}
```

---

## FAQ

### Q: Kenapa anggota keluar dengan status "Pending" masih muncul di laporan?
**A:** Karena pengembalian belum diproses. Simpanan masih ada di koperasi. Setelah proses pengembalian selesai, baru tidak muncul.

### Q: Bagaimana jika ingin tetap menampilkan anggota keluar di laporan?
**A:** Gunakan fungsi original `getTotalSimpananPokok()` dan `getTotalSimpananWajib()`, atau set parameter `excludeProcessedKeluar = false`.

### Q: Apakah data simpanan dihapus setelah pengembalian?
**A:** Tidak. Data simpanan tetap ada di localStorage untuk keperluan audit. Yang berubah adalah:
1. Status anggota menjadi "Keluar"
2. pengembalianStatus menjadi "Selesai"
3. Jurnal akuntansi mencatat penarikan
4. Laporan tidak menghitung simpanan anggota tersebut

### Q: Bagaimana dengan laporan historis?
**A:** Untuk laporan historis (misalnya per periode), Anda bisa:
1. Filter berdasarkan tanggal transaksi simpanan
2. Cek apakah tanggal transaksi < tanggal keluar anggota
3. Jika ya, hitung. Jika tidak, skip.

---

## Checklist Implementasi

Untuk mengimplementasikan di sistem Anda:

- [ ] Update fungsi laporan simpanan pokok untuk menggunakan `getAnggotaWithSimpananForLaporan()`
- [ ] Update fungsi laporan simpanan wajib untuk menggunakan `getAnggotaWithSimpananForLaporan()`
- [ ] Update dashboard/summary untuk menggunakan fungsi baru
- [ ] Test dengan anggota keluar (pending)
- [ ] Test dengan anggota keluar (selesai)
- [ ] Verifikasi total simpanan di laporan akurat
- [ ] Verifikasi jurnal akuntansi tercatat saat proses pengembalian

---

## File yang Dimodifikasi

- ✅ `js/anggotaKeluarManager.js` - Menambahkan 3 fungsi baru

## File yang Perlu Diupdate (Manual)

- ⚠️ File laporan simpanan Anda (tergantung implementasi)
- ⚠️ Dashboard/summary yang menampilkan total simpanan

---

**Update:** 5 Desember 2024  
**Status:** Implemented  
**Priority:** HIGH
