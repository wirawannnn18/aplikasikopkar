// Debug script to test rollback scenario
const {
    ClosedShiftDeletionService,
    TutupKasirAdjustmentService,
    DataIntegrityValidator
} = require('./js/hapusTransaksiTutupKasir.js');

// Mock localStorage
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

// Setup test data
localStorage.clear();

const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' }
];
localStorage.setItem('users', JSON.stringify(users));

const coa = [
    { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
    { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 2000000 }
];
localStorage.setItem('coa', JSON.stringify(coa));

const transaction = {
    id: 'trans-rollback',
    noTransaksi: 'TRX-ROLLBACK',
    tanggal: new Date('2024-01-17T16:00:00').toISOString(),
    total: 60000,
    metode: 'cash',
    kasir: 'kasir1',
    items: [
        { id: 'item-rollback', nama: 'Produk C', qty: 1, harga: 60000, hpp: 30000 }
    ]
};

const barang = [
    { id: 'item-rollback', nama: 'Produk C', stok: 20, harga: 60000 }
];

localStorage.setItem('posTransactions', JSON.stringify([transaction]));
localStorage.setItem('barang', JSON.stringify(barang));
// Intentionally NOT creating a shift

console.log('=== Debug Rollback Test ===');
console.log('Transaction:', transaction);
console.log('Shifts in storage:', localStorage.getItem('riwayatTutupKas'));

// Test identifyShift
const adjustmentService = new TutupKasirAdjustmentService();
const shift = adjustmentService.identifyShift(transaction);
console.log('Identified shift:', shift);

// Test pre-validation
const validator = new DataIntegrityValidator();
const preValidation = validator.preDeleteValidation('trans-rollback');
console.log('Pre-validation result:', preValidation);

// Test deletion
const service = new ClosedShiftDeletionService();
const deletionData = {
    category: 'Kesalahan Input',
    reason: 'Testing rollback scenario when validation fails',
    username: 'admin',
    password: 'admin123',
    user: { username: 'admin', role: 'administrator' }
};

const result = service.deleteClosedTransaction('trans-rollback', deletionData);
console.log('Deletion result:', result);
console.log('Expected success: false, Actual success:', result.success);
