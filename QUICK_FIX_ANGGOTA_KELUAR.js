/**
 * QUICK FIX: Anggota Keluar
 * 
 * Cara pakai:
 * 1. Buka aplikasi di browser
 * 2. Tekan F12 untuk buka Console
 * 3. Copy-paste SEMUA kode di file ini ke Console
 * 4. Tekan Enter
 * 5. Ikuti instruksi yang muncul
 */

console.log('%c=== QUICK FIX: ANGGOTA KELUAR ===', 'color: blue; font-size: 16px; font-weight: bold');
console.log('Starting diagnostic and fix...\n');

// Step 1: Check if functions exist
console.log('%c[1/6] Checking functions...', 'color: orange; font-weight: bold');
const functionsToCheck = [
    'markAnggotaKeluar',
    'calculatePengembalian',
    'validatePengembalian',
    'processPengembalian',
    'generateBuktiAnggotaKeluar',
    'showSuccessAnggotaKeluarModal',
    'handleCetakBuktiAnggotaKeluar'
];

let allFunctionsExist = true;
functionsToCheck.forEach(funcName => {
    const exists = typeof window[funcName] === 'function';
    console.log(`  ${exists ? '✅' : '❌'} ${funcName}: ${typeof window[funcName]}`);
    if (!exists) allFunctionsExist = false;
});

if (!allFunctionsExist) {
    console.log('%c❌ Some functions are missing!', 'color: red; font-weight: bold');
    console.log('%cSOLUTION: Hard refresh the page (Ctrl+Shift+R)', 'color: yellow; font-weight: bold');
    alert('❌ Beberapa fungsi tidak ditemukan!\n\nSolusi:\n1. Tekan Ctrl+Shift+R untuk hard refresh\n2. Jalankan script ini lagi');
} else {
    console.log('%c✅ All functions exist', 'color: green; font-weight: bold');
}

// Step 2: Check validation behavior
console.log('\n%c[2/6] Testing validation behavior...', 'color: orange; font-weight: bold');

// Create test data
const testAnggotaId = 'quickfix-test-' + Date.now();
const testAnggota = {
    id: testAnggotaId,
    nik: '9999999999999999',
    nama: 'QuickFix Test User',
    statusKeanggotaan: 'Aktif'
};

let anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
anggotaList.push(testAnggota);
localStorage.setItem('anggota', JSON.stringify(anggotaList));

localStorage.setItem('simpananPokok', JSON.stringify([
    { id: 'sp-qf', anggotaId: testAnggotaId, jumlah: 500000 }
]));

localStorage.setItem('simpananWajib', JSON.stringify([
    { id: 'sw-qf', anggotaId: testAnggotaId, jumlah: 100000 }
]));

// Clear jurnal to ensure 0 balance
localStorage.setItem('jurnal', JSON.stringify([]));

console.log('  Test data created');

// Mark as keluar first
const markResult = markAnggotaKeluar(testAnggotaId, '2024-12-05', 'QuickFix test');
if (!markResult.success) {
    console.log('  ❌ Failed to mark keluar:', markResult.error.message);
} else {
    console.log('  ✅ Marked as keluar');
}

// Test validation
const validationResult = validatePengembalian(testAnggotaId, 'Kas');
console.log('  Validation result:', validationResult);

if (validationResult.valid === true && validationResult.warnings && validationResult.warnings.length > 0) {
    console.log('%c✅ CORRECT: Validation returns valid=true with warnings', 'color: green; font-weight: bold');
    console.log('  Warnings:', validationResult.warnings.map(w => w.message));
} else if (validationResult.valid === false) {
    console.log('%c❌ WRONG: Validation returns valid=false', 'color: red; font-weight: bold');
    console.log('%cThis means the old code is still running!', 'color: red; font-weight: bold');
    console.log('%cSOLUTION: Force reload', 'color: yellow; font-weight: bold');
    
    alert('❌ Kode lama masih berjalan!\n\nValidasi masih mengembalikan ERROR, bukan WARNING.\n\nSolusi:\n1. Tutup SEMUA tab browser\n2. Buka Task Manager (Ctrl+Shift+Esc)\n3. Kill semua proses browser\n4. Buka browser lagi\n5. Buka aplikasi\n6. Jalankan script ini lagi');
} else {
    console.log('%c⚠️ UNEXPECTED: Validation result is unusual', 'color: orange; font-weight: bold');
    console.log('  valid:', validationResult.valid);
    console.log('  errors:', validationResult.errors);
    console.log('  warnings:', validationResult.warnings);
}

// Step 3: Test bukti generation
console.log('\n%c[3/6] Testing bukti generation...', 'color: orange; font-weight: bold');
const buktiResult = generateBuktiAnggotaKeluar(testAnggotaId);
if (buktiResult.success) {
    console.log('  ✅ Bukti generated successfully');
    console.log('  Nomor Referensi:', buktiResult.data.nomorReferensi);
} else {
    console.log('  ❌ Bukti generation failed:', buktiResult.error.message);
}

// Step 4: Check file version
console.log('\n%c[4/6] Checking file version...', 'color: orange; font-weight: bold');
fetch('js/anggotaKeluarManager.js')
    .then(r => r.text())
    .then(text => {
        if (text.includes('validationWarnings.push') && text.includes('Changed to WARNING instead of ERROR')) {
            console.log('  ✅ File is updated (WARNING version)');
        } else if (text.includes('validationErrors.push')) {
            console.log('  ❌ File is OLD version (ERROR version)');
            console.log('%c  ⚠️ Browser is serving cached file!', 'color: red; font-weight: bold');
            alert('❌ Browser masih menggunakan file lama!\n\nSolusi:\n1. Hard refresh: Ctrl+Shift+R\n2. Atau clear cache browser\n3. Atau buka di incognito mode');
        } else {
            console.log('  ⚠️ Cannot determine file version');
        }
    })
    .catch(err => {
        console.log('  ❌ Cannot fetch file:', err.message);
    });

// Step 5: Check current user role
console.log('\n%c[5/6] Checking user role...', 'color: orange; font-weight: bold');
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
console.log('  Current user:', currentUser);
if (currentUser.role === 'administrator' || currentUser.role === 'super_admin') {
    console.log('  ✅ User has correct role');
} else {
    console.log('  ⚠️ User role:', currentUser.role);
    console.log('  Note: Only administrator and super_admin can mark anggota keluar');
}

// Step 6: Cleanup test data
console.log('\n%c[6/6] Cleaning up test data...', 'color: orange; font-weight: bold');
anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
anggotaList = anggotaList.filter(a => a.id !== testAnggotaId);
localStorage.setItem('anggota', JSON.stringify(anggotaList));
console.log('  ✅ Test data removed');

// Final summary
console.log('\n%c=== SUMMARY ===', 'color: blue; font-size: 16px; font-weight: bold');
console.log('Check the results above.');
console.log('\nIf validation is still returning ERROR instead of WARNING:');
console.log('1. Close ALL browser tabs');
console.log('2. Open Task Manager (Ctrl+Shift+Esc)');
console.log('3. Kill all browser processes');
console.log('4. Open browser again');
console.log('5. Open the application');
console.log('6. Run this script again');
console.log('\nOr try opening in Incognito/Private mode.');

console.log('\n%cDone!', 'color: green; font-size: 16px; font-weight: bold');
