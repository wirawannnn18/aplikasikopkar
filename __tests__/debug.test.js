import '../js/hapusTransaksiTutupKasir.js';

const ClosedShiftDeletionService = global.ClosedShiftDeletionService || window.ClosedShiftDeletionService;

describe('Debug test', () => {
    beforeEach(() => {
        localStorage.clear();
        
        const users = [
            { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
            { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 500000 },
            { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 2000000 },
            { kode: '4-1000', nama: 'Pendapatan Penjualan', tipe: 'Pendapatan', saldo: 5000000 },
            { kode: '5-1000', nama: 'Harga Pokok Penjualan', tipe: 'Beban', saldo: 2000000 }
        ];
        localStorage.setItem('coa', JSON.stringify(coa));
    });
    
    test('should show actual error message', () => {
        const transaction = {
            id: 'trans-123',
            noTransaksi: 'TRX-123',
            tanggal: new Date().toISOString(),
            total: 50000,
            metode: 'cash',
            kasir: 'kasir1',
            items: [
                { id: 'item-1', nama: 'Item 1', qty: 1, harga: 50000, hpp: 25000 }
            ]
        };
        
        const shift = {
            id: 'shift-123',
            tanggalTutup: transaction.tanggal,
            totalPenjualan: 1000000,
            totalKas: 800000,
            kasir: 'kasir1'
        };
        
        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-1', nama: 'Item 1', stok: 100, harga: 50000 }
        ]));
        
        const service = new ClosedShiftDeletionService();
        const deletionData = {
            category: 'Kesalahan Input',
            reason: 'Test to see actual error message',
            username: 'admin',
            password: 'admin123',
            user: { username: 'admin', role: 'administrator' }
        };
        
        const result = service.deleteClosedTransaction(transaction.id, deletionData);
        
        console.log('Result:', JSON.stringify(result, null, 2));
        
        expect(result.success).toBe(true);
    });
});
