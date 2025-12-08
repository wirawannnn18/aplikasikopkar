# Quick Test Guide: Auto-Delete Anggota Keluar

## 🎯 Tujuan Testing
Memverifikasi bahwa sistem auto-delete anggota keluar berfungsi dengan benar setelah pengembalian selesai.

---

## 📋 Pre-requisites

### 1. Backup Data
```javascript
// Buat backup manual sebelum testing
localStorage.setItem('backup_before_test', JSON.stringify({
  anggota: localStorage.getItem('anggota'),
  simpanan: localStorage.getItem('simpananPokok'),
  jurnal: localStorage.getItem('jurnal')
}));
```

### 2. Reset Migration Flag (jika perlu test ulang)
```javascript
// Buka Console Browser (F12)
localStorage.removeItem('migration_anggota_keluar_completed');
localStorage.removeItem('migration_anggota_keluar_date');
```

---

## 🧪 Test Scenarios

### Test 1: Auto-Delete Flow (Happy Path)

**Steps:**
1. Login sebagai Admin
2. Buka menu "Master Anggota"
3. Pilih anggota yang akan keluar
4. Klik tombol "Anggota Keluar" (ikon box-arrow-right)
5. Isi form:
   - Tanggal Keluar: (pilih tanggal hari ini)
   - Alasan Keluar: "Pensiun"
6. Klik "Simpan"

**Expected Result:**
- ✅ Status anggota berubah menjadi "Nonaktif"
- ✅ Muncul notifikasi sukses
- ✅ Audit log tercatat dengan action "MARK_ANGGOTA_KELUAR"

**Verify in Console:**
```javascript
// Check anggota status
const anggota = JSON.parse(localStorage.getItem('anggota'));
const testAnggota = anggota.find(a => a.nama === 'NAMA_ANGGOTA');
console.log('Status:', testAnggota.status); // Should be 'Nonaktif'
console.log('Pengembalian Status:', testAnggota.pengembalianStatus); // Should be 'Pending'
```

---

### Test 2: Process Pengembalian

**Steps:**
1. Dari menu "Master Anggota", klik tombol "Proses Pengembalian" (ikon cash-coin)
2. Review detail pengembalian:
   - Simpanan Pokok
   - Simpanan Wajib
   - Total Pengembalian
3. Isi form:
   - Metode Pembayaran: "Kas"
   - Tanggal Pembayaran: (hari ini)
   - Keterangan: "Pengembalian simpanan"
4. Klik "Proses Pengembalian"

**Expected Result:**
- ✅ Pengembalian berhasil diproses
- ✅ Jurnal akuntansi tercatat
- ✅ Simpanan di-zero-kan
- ✅ **ANGGOTA AUTO-DELETED** (ini yang kita test!)
- ✅ Muncul notifikasi sukses

**Verify Auto-Delete in Console:**
```javascript
// Check if anggota deleted
const anggota = JSON.parse(localStorage.getItem('anggota'));
const testAnggota = anggota.find(a => a.nama === 'NAMA_ANGGOTA');
console.log('Anggota found:', testAnggota); // Should be undefined (deleted!)

// Check if simpanan deleted
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok'));
const testSimpanan = simpananPokok.filter(s => s.anggotaId === 'ANGGOTA_ID');
console.log('Simpanan found:', testSimpanan.length); // Should be 0 (deleted!)

// Check if jurnal preserved
const jurnal = JSON.parse(localStorage.getItem('jurnal'));
const pengembalianJurnal = jurnal.filter(j => j.keterangan.includes('Pengembalian'));
console.log('Jurnal preserved:', pengembalianJurnal.length); // Should be > 0 (kept!)

// Check if audit log created
const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
const autoDeleteLog = auditLog.filter(a => a.action === 'AUTO_DELETE_ANGGOTA_KELUAR');
console.log('Auto-delete log:', autoDeleteLog.length); // Should be > 0
```

---

### Test 3: Verify Anggota Keluar View

**Steps:**
1. Buka menu "Anggota Keluar"
2. Cari anggota yang baru saja diproses

**Expected Result:**
- ✅ Anggota muncul di list (dari tabel pengembalian)
- ✅ Menampilkan data: NIK, Nama, Tanggal Pengembalian, Total
- ✅ Status: "Selesai"
- ✅ Tombol "Cetak Surat" tersedia

**Verify in Console:**
```javascript
// Check pengembalian record exists
const pengembalian = JSON.parse(localStorage.getItem('pengembalian') || '[]');
const testPengembalian = pengembalian.find(p => p.anggotaNama === 'NAMA_ANGGOTA');
console.log('Pengembalian record:', testPengembalian); // Should exist
console.log('Status:', testPengembalian.status); // Should be 'Selesai'
```

---

### Test 4: Verify Master Anggota (No Filter)

**Steps:**
1. Buka menu "Master Anggota"
2. Cari anggota yang sudah dihapus

**Expected Result:**
- ✅ Anggota TIDAK muncul di list (sudah dihapus)
- ✅ Total count tidak termasuk anggota yang dihapus
- ✅ Tidak ada filter statusKeanggotaan

**Verify in Console:**
```javascript
// Check anggota not in master list
const anggota = JSON.parse(localStorage.getItem('anggota'));
const testAnggota = anggota.find(a => a.nama === 'NAMA_ANGGOTA');
console.log('Anggota in master:', testAnggota); // Should be undefined
```

---

### Test 5: Validation - Active Loan Blocks Delete

**Setup:**
1. Buat anggota baru
2. Buat pinjaman aktif untuk anggota tersebut
3. Mark anggota keluar
4. Proses pengembalian

**Expected Result:**
- ✅ Pengembalian berhasil
- ✅ **Auto-delete GAGAL** (karena ada pinjaman aktif)
- ✅ Anggota TETAP ADA di database
- ✅ Audit log mencatat "AUTO_DELETE_FAILED"

**Verify in Console:**
```javascript
// Check anggota still exists
const anggota = JSON.parse(localStorage.getItem('anggota'));
const testAnggota = anggota.find(a => a.nama === 'NAMA_ANGGOTA');
console.log('Anggota still exists:', testAnggota !== undefined); // Should be true

// Check audit log for failure
const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
const failedLog = auditLog.filter(a => a.action === 'AUTO_DELETE_FAILED');
console.log('Failed delete log:', failedLog.length); // Should be > 0
```

---

### Test 6: Validation - POS Debt Blocks Delete

**Setup:**
1. Buat anggota baru
2. Buat transaksi POS dengan hutang
3. Mark anggota keluar
4. Proses pengembalian

**Expected Result:**
- ✅ Pengembalian berhasil
- ✅ **Auto-delete GAGAL** (karena ada hutang POS)
- ✅ Anggota TETAP ADA di database
- ✅ Audit log mencatat "AUTO_DELETE_FAILED"

---

### Test 7: Migration Script

**Setup:**
1. Buat data test dengan `statusKeanggotaan = 'Keluar'`
2. Reset migration flag
3. Reload halaman

**Expected Result:**
- ✅ Migration auto-run on page load
- ✅ Anggota dengan `statusKeanggotaan = 'Keluar'` dan `pengembalianStatus = 'Selesai'` dihapus
- ✅ Anggota dengan `statusKeanggotaan = 'Keluar'` dan `pengembalianStatus = 'Pending'` diupdate ke `status = 'Nonaktif'`
- ✅ Field `statusKeanggotaan` dihapus dari semua anggota
- ✅ Backup dibuat sebelum migration
- ✅ Audit log mencatat migration

**Verify in Console:**
```javascript
// Check migration completed
const migrationCompleted = localStorage.getItem('migration_anggota_keluar_completed');
console.log('Migration completed:', migrationCompleted); // Should be 'true'

// Check backup exists
const backup = localStorage.getItem('migration_backup_anggota_keluar');
console.log('Backup exists:', backup !== null); // Should be true

// Check statusKeanggotaan removed
const anggota = JSON.parse(localStorage.getItem('anggota'));
const hasStatusKeanggotaan = anggota.some(a => a.hasOwnProperty('statusKeanggotaan'));
console.log('Has statusKeanggotaan:', hasStatusKeanggotaan); // Should be false
```

---

## 🔍 Verification Checklist

### After Auto-Delete:
- [ ] Anggota dihapus dari tabel `anggota`
- [ ] Simpanan dihapus dari tabel `simpananPokok`, `simpananWajib`, `simpananSukarela`
- [ ] Transaksi POS dihapus dari tabel `penjualan`
- [ ] Pinjaman lunas dihapus dari tabel `pinjaman`
- [ ] Pembayaran dihapus dari tabel `pembayaranHutangPiutang`
- [ ] Jurnal TETAP ADA di tabel `jurnal`
- [ ] Audit log TETAP ADA di tabel `auditLog`
- [ ] Pengembalian record TETAP ADA di tabel `pengembalian`
- [ ] Anggota muncul di menu "Anggota Keluar" (dari pengembalian)
- [ ] Anggota TIDAK muncul di menu "Master Anggota"

### Audit Trail:
- [ ] Action "MARK_ANGGOTA_KELUAR" tercatat
- [ ] Action "PROSES_PENGEMBALIAN" tercatat
- [ ] Action "AUTO_DELETE_ANGGOTA_KELUAR" tercatat
- [ ] Semua audit log memiliki timestamp, userId, userName

### Validation:
- [ ] Auto-delete gagal jika ada pinjaman aktif
- [ ] Auto-delete gagal jika ada hutang POS
- [ ] Pengembalian tetap sukses meskipun auto-delete gagal
- [ ] Audit log mencatat "AUTO_DELETE_FAILED" jika validasi gagal

---

## 🐛 Troubleshooting

### Issue: Anggota tidak terhapus setelah pengembalian

**Check:**
```javascript
// 1. Check if validation passed
const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
const failedLog = auditLog.filter(a => a.action === 'AUTO_DELETE_FAILED');
console.log('Failed logs:', failedLog);

// 2. Check if anggota has active loans
const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
const activePinjaman = pinjaman.filter(p => p.anggotaId === 'ANGGOTA_ID' && p.status !== 'Lunas');
console.log('Active loans:', activePinjaman);

// 3. Check if anggota has POS debt
// (Check in penjualan table)
```

### Issue: Migration tidak berjalan

**Check:**
```javascript
// 1. Check migration flag
const migrationCompleted = localStorage.getItem('migration_anggota_keluar_completed');
console.log('Migration completed:', migrationCompleted);

// 2. Reset flag and reload
localStorage.removeItem('migration_anggota_keluar_completed');
location.reload();
```

### Issue: Jurnal tidak tercatat

**Check:**
```javascript
// Check jurnal entries
const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
const pengembalianJurnal = jurnal.filter(j => j.keterangan.includes('Pengembalian'));
console.log('Pengembalian jurnal:', pengembalianJurnal);
```

---

## 📊 Test Data Template

### Create Test Anggota:
```javascript
const testAnggota = {
  id: 'TEST-001',
  nik: '1234567890',
  nama: 'Test Anggota Keluar',
  noKartu: 'K-001',
  departemen: 'IT',
  tipeAnggota: 'Anggota',
  status: 'Aktif',
  tanggalDaftar: '2020-01-01'
};

// Add to localStorage
const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
anggota.push(testAnggota);
localStorage.setItem('anggota', JSON.stringify(anggota));
```

### Create Test Simpanan:
```javascript
const testSimpananPokok = {
  id: 'SP-001',
  anggotaId: 'TEST-001',
  jumlah: 1000000,
  tanggal: '2020-01-01'
};

const testSimpananWajib = {
  id: 'SW-001',
  anggotaId: 'TEST-001',
  jumlah: 500000,
  tanggal: '2020-01-01'
};

// Add to localStorage
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
simpananPokok.push(testSimpananPokok);
localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));

const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
simpananWajib.push(testSimpananWajib);
localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
```

---

## ✅ Success Criteria

### All tests pass if:
1. ✅ Auto-delete berfungsi setelah pengembalian selesai
2. ✅ Validation mencegah delete jika ada kewajiban
3. ✅ Jurnal dan audit log tetap tersimpan
4. ✅ Anggota keluar view menggunakan data pengembalian
5. ✅ Master anggota tidak menampilkan anggota yang dihapus
6. ✅ Migration script berjalan dengan benar
7. ✅ Backup dibuat sebelum migration
8. ✅ Rollback berfungsi jika terjadi error

---

## 🎉 Ready to Test!

Sistem auto-delete anggota keluar sudah siap untuk ditest. Ikuti test scenarios di atas untuk memverifikasi semua fitur berfungsi dengan benar.

**Good luck testing! 🚀**
