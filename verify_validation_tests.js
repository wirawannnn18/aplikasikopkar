/**
 * Verification script for validation property tests
 * Tests Property 2 and Property 6 manually
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();

global.localStorage = localStorageMock;

// Mock functions
global.formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`;
global.showAlert = () => {};
global.generateId = () => 'TEST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
global.addJurnal = () => {};
global.filterTransactableAnggota = (anggotaList) => {
    if (!anggotaList) {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        return anggota.filter(a => a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar');
    }
    return anggotaList.filter(a => a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar');
};
global.validateAnggotaForHutangPiutang = () => ({ valid: true });

// Import the validation function (simulate)
function validatePembayaran(data) {
    // Check anggota selected
    if (!data.anggotaId) {
        return { valid: false, message: 'Silakan pilih anggota terlebih dahulu' };
    }
    
    // Check jenis selected
    if (!data.jenis) {
        return { valid: false, message: 'Silakan pilih jenis pembayaran' };
    }
    
    // Check jumlah
    if (!data.jumlah || data.jumlah <= 0) {
        return { valid: false, message: 'Jumlah pembayaran harus lebih dari 0' };
    }
    
    if (data.jumlah < 0) {
        return { valid: false, message: 'Jumlah pembayaran tidak boleh negatif' };
    }
    
    // Check against saldo
    const saldo = data.jenis === 'hutang' 
        ? hitungSaldoHutang(data.anggotaId)
        : hitungSaldoPiutang(data.anggotaId);
    
    if (saldo === 0) {
        const jenisText = data.jenis === 'hutang' ? 'hutang' : 'piutang';
        return { valid: false, message: `Anggota tidak memiliki ${jenisText} yang perlu dibayar` };
    }
    
    if (data.jumlah > saldo) {
        const jenisText = data.jenis === 'hutang' ? 'hutang' : 'piutang';
        return { valid: false, message: `Jumlah pembayaran melebihi saldo ${jenisText} (${formatRupiah(saldo)})` };
    }
    
    return { valid: true, message: '' };
}

function hitungSaldoHutang(anggotaId) {
    try {
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Total kredit from POS transactions
        const totalKredit = penjualan
            .filter(p => p.anggotaId === anggotaId && p.metodePembayaran === 'Kredit')
            .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
        
        // Total payments already made
        const totalBayar = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
        
        return totalKredit - totalBayar;
    } catch (error) {
        console.error('Error calculating hutang saldo:', error);
        return 0;
    }
}

function hitungSaldoPiutang(anggotaId) {
    try {
        const simpananList = JSON.parse(localStorage.getItem('simpanan') || '[]');
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Get simpanan for this anggota that are marked for pengembalian
        const anggotaSimpanan = simpananList.filter(s => 
            s.anggotaId === anggotaId && 
            s.statusPengembalian === 'pending'
        );
        
        // Calculate total piutang from simpanan balances
        let totalPiutang = 0;
        anggotaSimpanan.forEach(simpanan => {
            totalPiutang += parseFloat(simpanan.saldo || 0);
        });
        
        // Subtract payments already made
        const totalBayar = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
        
        return totalPiutang - totalBayar;
    } catch (error) {
        console.error('Error calculating piutang saldo:', error);
        return 0;
    }
}

// Test Property 2: Hutang payment validation
function testProperty2() {
    console.log('Testing Property 2: Hutang payment validation');
    
    let passCount = 0;
    let totalTests = 0;
    
    // Test cases
    const testCases = [
        { saldo: 100000, jumlah: 50000, shouldPass: true, desc: 'Valid payment within saldo' },
        { saldo: 100000, jumlah: 150000, shouldPass: false, desc: 'Payment exceeding saldo' },
        { saldo: 100000, jumlah: 0, shouldPass: false, desc: 'Zero payment' },
        { saldo: 100000, jumlah: -10000, shouldPass: false, desc: 'Negative payment' },
        { saldo: 0, jumlah: 10000, shouldPass: false, desc: 'No saldo available' }
    ];
    
    testCases.forEach(testCase => {
        totalTests++;
        
        // Setup
        localStorage.clear();
        const penjualan = [{ anggotaId: 'A001', metodePembayaran: 'Kredit', total: testCase.saldo }];
        localStorage.setItem('penjualan', JSON.stringify(penjualan));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
        
        const data = {
            anggotaId: 'A001',
            jenis: 'hutang',
            jumlah: testCase.jumlah
        };
        
        const validation = validatePembayaran(data);
        
        const passed = testCase.shouldPass ? validation.valid : !validation.valid;
        
        if (passed) {
            passCount++;
            console.log(`✓ ${testCase.desc}`);
        } else {
            console.log(`✗ ${testCase.desc} - Expected ${testCase.shouldPass ? 'valid' : 'invalid'}, got ${validation.valid ? 'valid' : 'invalid'}`);
            console.log(`  Message: ${validation.message}`);
        }
    });
    
    console.log(`Property 2 Results: ${passCount}/${totalTests} tests passed\n`);
    return passCount === totalTests;
}

// Test Property 6: Piutang payment validation
function testProperty6() {
    console.log('Testing Property 6: Piutang payment validation');
    
    let passCount = 0;
    let totalTests = 0;
    
    // Test cases
    const testCases = [
        { saldo: 100000, jumlah: 50000, shouldPass: true, desc: 'Valid payment within saldo' },
        { saldo: 100000, jumlah: 150000, shouldPass: false, desc: 'Payment exceeding saldo' },
        { saldo: 100000, jumlah: 0, shouldPass: false, desc: 'Zero payment' },
        { saldo: 100000, jumlah: -10000, shouldPass: false, desc: 'Negative payment' },
        { saldo: 0, jumlah: 10000, shouldPass: false, desc: 'No saldo available' }
    ];
    
    testCases.forEach(testCase => {
        totalTests++;
        
        // Setup
        localStorage.clear();
        const simpanan = [{ anggotaId: 'A001', statusPengembalian: 'pending', saldo: testCase.saldo }];
        localStorage.setItem('simpanan', JSON.stringify(simpanan));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
        
        const data = {
            anggotaId: 'A001',
            jenis: 'piutang',
            jumlah: testCase.jumlah
        };
        
        const validation = validatePembayaran(data);
        
        const passed = testCase.shouldPass ? validation.valid : !validation.valid;
        
        if (passed) {
            passCount++;
            console.log(`✓ ${testCase.desc}`);
        } else {
            console.log(`✗ ${testCase.desc} - Expected ${testCase.shouldPass ? 'valid' : 'invalid'}, got ${validation.valid ? 'valid' : 'invalid'}`);
            console.log(`  Message: ${validation.message}`);
        }
    });
    
    console.log(`Property 6 Results: ${passCount}/${totalTests} tests passed\n`);
    return passCount === totalTests;
}

// Test missing anggota validation
function testMissingAnggotaValidation() {
    console.log('Testing missing anggota validation');
    
    const data = {
        anggotaId: '',
        jenis: 'hutang',
        jumlah: 50000
    };
    
    const validation = validatePembayaran(data);
    
    if (!validation.valid && validation.message.includes('pilih anggota')) {
        console.log('✓ Missing anggota validation works');
        return true;
    } else {
        console.log('✗ Missing anggota validation failed');
        return false;
    }
}

// Test missing jenis validation
function testMissingJenisValidation() {
    console.log('Testing missing jenis validation');
    
    const data = {
        anggotaId: 'A001',
        jenis: '',
        jumlah: 50000
    };
    
    const validation = validatePembayaran(data);
    
    if (!validation.valid && validation.message.includes('pilih jenis')) {
        console.log('✓ Missing jenis validation works');
        return true;
    } else {
        console.log('✗ Missing jenis validation failed');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('=== Validation Property Tests Verification ===\n');
    
    const results = [
        testProperty2(),
        testProperty6(),
        testMissingAnggotaValidation(),
        testMissingJenisValidation()
    ];
    
    const allPassed = results.every(r => r);
    
    console.log('=== Summary ===');
    console.log(`Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return allPassed;
}

// Run if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
    runAllTests();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testProperty2,
        testProperty6,
        validatePembayaran,
        hitungSaldoHutang,
        hitungSaldoPiutang
    };
}