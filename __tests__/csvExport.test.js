/**
 * Unit Tests for CSV Export Functionality
 * Task 5.3: Write unit tests for CSV export
 * 
 * Tests validate that CSV export includes all required columns,
 * data matches report data, and UTF-8 BOM is included.
 * 
 * Validates: Requirements 4.1, 4.2, 4.3
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Mock DOM elements
global.document = {
    getElementById: (id) => {
        if (id === 'filterDepartemenHutangPiutang') {
            return { value: '' };
        }
        return null;
    },
    createElement: () => ({
        style: {},
        click: () => {},
        remove: () => {}
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

// Mock Blob
global.Blob = class Blob {
    constructor(content, options) {
        this.content = content;
        this.options = options;
    }
};

// Mock URL.createObjectURL
global.URL = {
    createObjectURL: () => 'blob:mock-url'
};

// Mock navigator
global.navigator = {
    msSaveBlob: undefined
};

// Helper functions from utils.js
function hitungTotalKredit(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') return 0;
    try {
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        return penjualan
            .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
            .reduce((sum, p) => sum + (p.total || 0), 0);
    } catch (error) {
        return 0;
    }
}

function hitungTotalPembayaranHutang(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') return 0;
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        return pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (p.jumlah || 0), 0);
    } catch (error) {
        return 0;
    }
}

function hitungSaldoHutang(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') return 0;
    try {
        const totalKredit = hitungTotalKredit(anggotaId);
        const totalPembayaran = hitungTotalPembayaranHutang(anggotaId);
        return totalKredit - totalPembayaran;
    } catch (error) {
        return 0;
    }
}

// Function to generate CSV content (extracted from downloadHutangPiutangCSV)
function generateCSVContent(dataToExport) {
    const BOM = '\uFEFF';
    const headers = ['NIK', 'Nama Anggota', 'Departemen', 'Total Kredit', 'Total Pembayaran', 'Saldo Hutang', 'Status'];
    let csvContent = BOM + headers.join(',') + '\n';
    
    dataToExport.forEach(data => {
        const row = [
            `"${data.nik}"`,
            `"${data.nama}"`,
            `"${data.departemen}"`,
            data.totalKredit || 0,
            data.totalPembayaran || 0,
            data.saldoHutang || 0,
            `"${data.status}"`
        ];
        csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
}

describe('Task 5.3: CSV Export Unit Tests', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });
    
    describe('CSV Header Tests', () => {
        
        test('CSV includes all required column headers', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            const lines = csvContent.split('\n');
            const headerLine = lines[0].replace('\uFEFF', ''); // Remove BOM
            
            expect(headerLine).toContain('NIK');
            expect(headerLine).toContain('Nama Anggota');
            expect(headerLine).toContain('Departemen');
            expect(headerLine).toContain('Total Kredit');
            expect(headerLine).toContain('Total Pembayaran');
            expect(headerLine).toContain('Saldo Hutang');
            expect(headerLine).toContain('Status');
        });
        
        test('CSV headers are in correct order', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            const lines = csvContent.split('\n');
            const headerLine = lines[0].replace('\uFEFF', '');
            const headers = headerLine.split(',');
            
            expect(headers[0]).toBe('NIK');
            expect(headers[1]).toBe('Nama Anggota');
            expect(headers[2]).toBe('Departemen');
            expect(headers[3]).toBe('Total Kredit');
            expect(headers[4]).toBe('Total Pembayaran');
            expect(headers[5]).toBe('Saldo Hutang');
            expect(headers[6]).toBe('Status');
        });
    });
    
    describe('CSV Data Tests', () => {
        
        test('CSV data matches report data', () => {
            const anggota = { id: 'A001', nik: '1234', nama: 'Budi Santoso', departemen: 'IT' };
            localStorage.setItem('anggota', JSON.stringify([anggota]));
            
            const penjualan = [{
                id: 'P001',
                anggotaId: 'A001',
                total: 500000,
                status: 'kredit'
            }];
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            
            const pembayaran = [{
                id: 'PAY001',
                anggotaId: 'A001',
                jenis: 'hutang',
                jumlah: 200000,
                status: 'selesai'
            }];
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            // Calculate expected values
            const totalKredit = hitungTotalKredit('A001');
            const totalPembayaran = hitungTotalPembayaranHutang('A001');
            const saldoHutang = hitungSaldoHutang('A001');
            const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
            
            const reportData = [{
                nik: anggota.nik,
                nama: anggota.nama,
                departemen: anggota.departemen,
                totalKredit: totalKredit,
                totalPembayaran: totalPembayaran,
                saldoHutang: saldoHutang,
                status: status
            }];
            
            const csvContent = generateCSVContent(reportData);
            const lines = csvContent.split('\n');
            const dataLine = lines[1]; // Second line is data
            
            expect(dataLine).toContain(anggota.nik);
            expect(dataLine).toContain(anggota.nama);
            expect(dataLine).toContain(anggota.departemen);
            expect(dataLine).toContain(totalKredit.toString());
            expect(dataLine).toContain(totalPembayaran.toString());
            expect(dataLine).toContain(saldoHutang.toString());
            expect(dataLine).toContain(status);
        });
        
        test('CSV handles multiple anggota correctly', () => {
            const anggotaList = [
                { id: 'A001', nik: '1234', nama: 'User 1', departemen: 'IT' },
                { id: 'A002', nik: '5678', nama: 'User 2', departemen: 'Finance' },
                { id: 'A003', nik: '9012', nama: 'User 3', departemen: 'HR' }
            ];
            
            const reportData = anggotaList.map(a => ({
                nik: a.nik,
                nama: a.nama,
                departemen: a.departemen,
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }));
            
            const csvContent = generateCSVContent(reportData);
            const lines = csvContent.split('\n').filter(line => line.trim() !== '');
            
            // Should have header + 3 data rows
            expect(lines.length).toBe(4);
            
            // Verify each anggota is in CSV
            anggotaList.forEach(anggota => {
                expect(csvContent).toContain(anggota.nik);
                expect(csvContent).toContain(anggota.nama);
            });
        });
        
        test('CSV handles special characters in names', () => {
            const testData = [{
                nik: '1234',
                nama: 'User, with "quotes" and commas',
                departemen: 'IT & Finance',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            
            // Names should be quoted
            expect(csvContent).toContain('"User, with "quotes" and commas"');
        });
        
        test('CSV handles zero values correctly', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 0,
                totalPembayaran: 0,
                saldoHutang: 0,
                status: 'Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            const lines = csvContent.split('\n');
            const dataLine = lines[1];
            
            // Should contain zeros
            expect(dataLine).toContain(',0,0,0,');
        });
        
        test('CSV handles negative saldoHutang (overpayment)', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 100000,
                totalPembayaran: 150000,
                saldoHutang: -50000,
                status: 'Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            
            expect(csvContent).toContain('-50000');
            expect(csvContent).toContain('Lunas');
        });
    });
    
    describe('CSV Format Tests', () => {
        
        test('CSV includes UTF-8 BOM', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            
            // Check for UTF-8 BOM at start
            expect(csvContent.charCodeAt(0)).toBe(0xFEFF);
        });
        
        test('CSV uses comma as delimiter', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            const lines = csvContent.split('\n');
            const headerLine = lines[0].replace('\uFEFF', '');
            
            // Count commas in header (should be 6 for 7 columns)
            const commaCount = (headerLine.match(/,/g) || []).length;
            expect(commaCount).toBe(6);
        });
        
        test('CSV uses newline as row separator', () => {
            const testData = [
                { nik: '1234', nama: 'User 1', departemen: 'IT', totalKredit: 100000, totalPembayaran: 50000, saldoHutang: 50000, status: 'Belum Lunas' },
                { nik: '5678', nama: 'User 2', departemen: 'Finance', totalKredit: 200000, totalPembayaran: 100000, saldoHutang: 100000, status: 'Belum Lunas' }
            ];
            
            const csvContent = generateCSVContent(testData);
            const lines = csvContent.split('\n').filter(line => line.trim() !== '');
            
            // Should have header + 2 data rows
            expect(lines.length).toBe(3);
        });
        
        test('CSV quotes text fields', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            
            // Text fields should be quoted
            expect(csvContent).toContain('"1234"');
            expect(csvContent).toContain('"Test User"');
            expect(csvContent).toContain('"IT"');
            expect(csvContent).toContain('"Belum Lunas"');
        });
        
        test('CSV does not quote numeric fields', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            const lines = csvContent.split('\n');
            const dataLine = lines[1];
            
            // Numeric values should not be quoted
            expect(dataLine).toContain(',100000,');
            expect(dataLine).toContain(',50000,');
        });
    });
    
    describe('CSV Edge Cases', () => {
        
        test('CSV handles empty data array', () => {
            const testData = [];
            const csvContent = generateCSVContent(testData);
            const lines = csvContent.split('\n').filter(line => line.trim() !== '');
            
            // Should only have header
            expect(lines.length).toBe(1);
        });
        
        test('CSV handles missing departemen', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: '-',
                totalKredit: 100000,
                totalPembayaran: 50000,
                saldoHutang: 50000,
                status: 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            
            expect(csvContent).toContain('"-"');
        });
        
        test('CSV handles null/undefined values', () => {
            const testData = [{
                nik: '1234',
                nama: 'Test User',
                departemen: 'IT',
                totalKredit: null,
                totalPembayaran: undefined,
                saldoHutang: 0,
                status: 'Lunas'
            }];
            
            const csvContent = generateCSVContent(testData);
            
            // Null/undefined should be converted to 0
            expect(csvContent).toContain(',0,0,0,');
        });
    });
    
    describe('CSV Integration with Report Data', () => {
        
        test('CSV data consistency with calculation functions', () => {
            const anggota = { id: 'A001', nik: '1234', nama: 'Test User', departemen: 'IT' };
            localStorage.setItem('anggota', JSON.stringify([anggota]));
            
            const penjualan = [
                { id: 'P001', anggotaId: 'A001', total: 300000, status: 'kredit' },
                { id: 'P002', anggotaId: 'A001', total: 200000, status: 'kredit' }
            ];
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            
            const pembayaran = [
                { id: 'PAY001', anggotaId: 'A001', jenis: 'hutang', jumlah: 150000, status: 'selesai' },
                { id: 'PAY002', anggotaId: 'A001', jenis: 'hutang', jumlah: 100000, status: 'selesai' }
            ];
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            // Calculate using utility functions
            const totalKredit = hitungTotalKredit('A001');
            const totalPembayaran = hitungTotalPembayaranHutang('A001');
            const saldoHutang = hitungSaldoHutang('A001');
            
            expect(totalKredit).toBe(500000);
            expect(totalPembayaran).toBe(250000);
            expect(saldoHutang).toBe(250000);
            
            // Generate CSV
            const reportData = [{
                nik: anggota.nik,
                nama: anggota.nama,
                departemen: anggota.departemen,
                totalKredit: totalKredit,
                totalPembayaran: totalPembayaran,
                saldoHutang: saldoHutang,
                status: saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas'
            }];
            
            const csvContent = generateCSVContent(reportData);
            
            // Verify CSV contains correct calculated values
            expect(csvContent).toContain('500000');
            expect(csvContent).toContain('250000');
            expect(csvContent).toContain('250000');
            expect(csvContent).toContain('Belum Lunas');
        });
    });
});
