# Quick Test: Filter Anggota Keluar

**Quick validation script untuk Task 8 Checkpoint**

---

## 🚀 Quick Console Test

Buka browser DevTools (F12) → Console, lalu jalankan script ini:

```javascript
// ===== QUICK TEST SCRIPT =====
console.log('🧪 Testing Filter Anggota Keluar Implementation...\n');

// Test 1: Check if filterActiveAnggota function exists
console.log('Test 1: Function Existence');
if (typeof filterActiveAnggota === 'function') {
    console.log('✅ filterActiveAnggota() exists');
} else {
    console.log('❌ filterActiveAnggota() NOT FOUND');
}

if (typeof getActiveAnggotaCount === 'function') {
    console.log('✅ getActiveAnggotaCount() exists');
} else {
    console.log('❌ getActiveAnggotaCount() NOT FOUND');
}

// Test 2: Check localStorage data
console.log('\nTest 2: localStorage Data');
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const anggotaKeluar = allAnggota.filter(a => a.statusKeanggotaan === 'Keluar');
const anggotaAktif = allAnggota.filter(a => a.statusKeanggotaan !== 'Keluar');

console.log(`Total anggota in localStorage: ${allAnggota.length}`);
console.log(`Anggota Keluar: ${anggotaKeluar.length}`);
console.log(`Anggota Aktif: ${anggotaAktif.length}`);

if (anggotaKeluar.length > 0) {
    console.log('✅ Data preservation: Anggota keluar still in localStorage');
} else {
    console.log('⚠️  No anggota keluar in localStorage (create test data)');
}

// Test 3: Test filterActiveAnggota function
console.log('\nTest 3: filterActiveAnggota() Function');
const filtered = filterActiveAnggota(allAnggota);
console.log(`Input: ${allAnggota.length} anggota`);
console.log(`Output: ${filtered.length} anggota`);
console.log(`Filtered out: ${allAnggota.length - filtered.length} anggota`);

const hasKeluar = filtered.some(a => a.statusKeanggotaan === 'Keluar');
if (!hasKeluar && filtered.length === anggotaAktif.length) {
    console.log('✅ filterActiveAnggota() works correctly');
} else {
    console.log('❌ filterActiveAnggota() has issues');
}

// Test 4: Test getActiveAnggotaCount function
console.log('\nTest 4: getActiveAnggotaCount() Function');
const count = getActiveAnggotaCount();
console.log(`Active count: ${count}`);
if (count === anggotaAktif.length) {
    console.log('✅ getActiveAnggotaCount() works correctly');
} else {
    console.log('❌ getActiveAnggotaCount() returns wrong count');
}

// Test 5: Check if anggota keluar visible in current view
console.log('\nTest 5: Current View Check');
const tbody = document.getElementById('tbodyAnggota');
if (tbody) {
    const rows = tbody.querySelectorAll('tr');
    console.log(`Visible rows in table: ${rows.length}`);
    if (rows.length === anggotaAktif.length) {
        console.log('✅ Table shows only active anggota');
    } else {
        console.log('⚠️  Table row count mismatch');
    }
} else {
    console.log('⚠️  Not on Master Anggota page');
}

// Test 6: Check count badge
console.log('\nTest 6: Count Badge Check');
const badge = document.querySelector('.badge');
if (badge) {
    const badgeText = badge.textContent;
    console.log(`Badge text: "${badgeText}"`);
    if (badgeText.includes(anggotaAktif.length.toString())) {
        console.log('✅ Count badge shows correct number');
    } else {
        console.log('⚠️  Count badge may be incorrect');
    }
} else {
    console.log('⚠️  Count badge not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY');
console.log('='.repeat(50));
console.log(`Total anggota: ${allAnggota.length}`);
console.log(`Active anggota: ${anggotaAktif.length}`);
console.log(`Anggota keluar: ${anggotaKeluar.length}`);
console.log(`Filtered result: ${filtered.length}`);
console.log(`Active count: ${count}`);
console.log('='.repeat(50));

if (anggotaKeluar.length === 0) {
    console.log('\n⚠️  WARNING: No anggota keluar in test data');
    console.log('Create test data with statusKeanggotaan = "Keluar" to test properly');
}

console.log('\n✅ Quick test complete!');
```

---

## 📝 Create Test Data

Jika belum ada data test, jalankan script ini untuk membuat data:

```javascript
// ===== CREATE TEST DATA =====
console.log('Creating test data...');

const testAnggota = [
    {
        id: 'test-001',
        nik: '3201010101010001',
        nama: 'Budi Santoso',
        noKartu: 'K001',
        departemen: 'IT',
        tipeAnggota: 'Anggota',
        status: 'Aktif',
        statusKeanggotaan: 'Aktif',
        tanggalDaftar: '2024-01-15',
        telepon: '081234567890',
        email: 'budi@example.com',
        alamat: 'Jakarta'
    },
    {
        id: 'test-002',
        nik: '3201010101010002',
        nama: 'Siti Aminah',
        noKartu: 'K002',
        departemen: 'Finance',
        tipeAnggota: 'Anggota',
        status: 'Aktif',
        statusKeanggotaan: 'Aktif',
        tanggalDaftar: '2024-02-20',
        telepon: '081234567891',
        email: 'siti@example.com',
        alamat: 'Bandung'
    },
    {
        id: 'test-003',
        nik: '3201010101010003',
        nama: 'Ahmad Yani',
        noKartu: 'K003',
        departemen: 'HR',
        tipeAnggota: 'Anggota',
        status: 'Aktif',
        statusKeanggotaan: 'Aktif',
        tanggalDaftar: '2024-03-10',
        telepon: '081234567892',
        email: 'ahmad@example.com',
        alamat: 'Surabaya'
    },
    {
        id: 'test-004',
        nik: '3201010101010004',
        nama: 'Dewi Lestari',
        noKartu: 'K004',
        departemen: 'IT',
        tipeAnggota: 'Anggota',
        status: 'Nonaktif',
        statusKeanggotaan: 'Keluar',
        tanggalDaftar: '2023-06-15',
        tanggalKeluar: '2024-06-15',
        telepon: '081234567893',
        email: 'dewi@example.com',
        alamat: 'Yogyakarta'
    },
    {
        id: 'test-005',
        nik: '3201010101010005',
        nama: 'Eko Prasetyo',
        noKartu: 'K005',
        departemen: 'Finance',
        tipeAnggota: 'Anggota',
        status: 'Nonaktif',
        statusKeanggotaan: 'Keluar',
        tanggalDaftar: '2023-08-20',
        tanggalKeluar: '2024-08-20',
        telepon: '081234567894',
        email: 'eko@example.com',
        alamat: 'Semarang'
    }
];

// Get existing anggota
const existing = JSON.parse(localStorage.getItem('anggota') || '[]');

// Add test data (avoid duplicates)
testAnggota.forEach(test => {
    if (!existing.find(a => a.id === test.id)) {
        existing.push(test);
    }
});

// Save back to localStorage
localStorage.setItem('anggota', JSON.stringify(existing));

console.log('✅ Test data created!');
console.log(`Total anggota: ${existing.length}`);
console.log(`Active: ${existing.filter(a => a.statusKeanggotaan !== 'Keluar').length}`);
console.log(`Keluar: ${existing.filter(a => a.statusKeanggotaan === 'Keluar').length}`);
console.log('\nRefresh page to see changes.');
```

---

## 🔍 Detailed Inspection

Untuk melihat detail anggota keluar:

```javascript
// Show anggota keluar details
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const anggotaKeluar = allAnggota.filter(a => a.statusKeanggotaan === 'Keluar');

console.log('Anggota Keluar Details:');
anggotaKeluar.forEach((a, i) => {
    console.log(`\n${i + 1}. ${a.nama}`);
    console.log(`   NIK: ${a.nik}`);
    console.log(`   Status Keanggotaan: ${a.statusKeanggotaan}`);
    console.log(`   Tanggal Keluar: ${a.tanggalKeluar || 'N/A'}`);
});
```

---

## ✅ Expected Results

Setelah menjalankan quick test:

1. **Function Existence**: ✅ Both functions exist
2. **localStorage Data**: ✅ Data preserved (includes keluar)
3. **filterActiveAnggota()**: ✅ Filters correctly
4. **getActiveAnggotaCount()**: ✅ Returns correct count
5. **Current View**: ✅ Shows only active anggota
6. **Count Badge**: ✅ Shows correct number

---

## 🐛 Troubleshooting

### Issue: Functions not found
**Solution**: Pastikan file `js/koperasi.js` sudah di-load. Refresh page.

### Issue: No anggota keluar in data
**Solution**: Run "Create Test Data" script di atas.

### Issue: Table shows anggota keluar
**Solution**: 
1. Check if `filterActiveAnggota()` is called in `renderTableAnggota()`
2. Clear cache and refresh
3. Check browser console for errors

### Issue: Count mismatch
**Solution**:
1. Verify `getActiveAnggotaCount()` implementation
2. Check if `filterActiveAnggota()` is used in `renderAnggota()`
3. Refresh page

---

## 📊 Quick Validation Checklist

Run these one-liners in console:

```javascript
// 1. Check function exists
typeof filterActiveAnggota === 'function' && typeof getActiveAnggotaCount === 'function'
// Expected: true

// 2. Check data preservation
JSON.parse(localStorage.getItem('anggota')).length
// Expected: Total count (including keluar)

// 3. Check filtering works
filterActiveAnggota(JSON.parse(localStorage.getItem('anggota'))).every(a => a.statusKeanggotaan !== 'Keluar')
// Expected: true

// 4. Check count function
getActiveAnggotaCount() === JSON.parse(localStorage.getItem('anggota')).filter(a => a.statusKeanggotaan !== 'Keluar').length
// Expected: true

// 5. Check visible rows
document.getElementById('tbodyAnggota')?.querySelectorAll('tr').length === getActiveAnggotaCount()
// Expected: true (if on Master Anggota page)
```

---

**All checks should return `true` ✅**
