/**
 * Unit Tests for Pembayaran Module Integration
 * Task 2.1: Test that pembayaran module correctly uses shared functions
 * 
 * Requirements tested:
 * - 1.2: WHEN anggota melakukan pembayaran hutang THEN sistem SHALL memperbarui saldo hutang di laporan secara otomatis
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Load the utility functions and make them available globally
const utilsCode = readFileSync(join(__dirname, '../js/utils.js'), 'utf8');

// Create a function to evaluate the code in global scope
const evalInContext = (code) => {
    return function() {
        return eval(code);
    }.call(global);
};

evalInContext(utilsCode);

// Extract functions from utils.js and make them available
const { hitungSaldoHutang, hitungTotalPembayaranHutang, getPembayaranHutangHistory, hitungSaldoPiutang } = (() => {
    const context = {};
    const wrappedCode = `
        ${utilsCode}
        return {
            hitungSaldoHutang,
            hitungTotalPembayaranHutang,
            getPembayaranHutangHistory,
            hitungSaldoPiutang
        };
    `;
    return new Function(wrappedCode)();
})();

describe('Pembayaran Module Integration Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        
        // Setup test data
        const testAnggota = [
            {
                id: 'A001',
                nik: '1234567890',
                nama: 'Test User 1',
                departemen: 'IT'
            },
            {
                id: 'A002',
                nik: '0987654321',
                nama: 'Test User 2',
                departemen: 'Finance'
            }
        ];
        
        localStorage.setItem('anggota', JSON.stringify(testAnggota));
    });

    describe('Saldo Calculation Before Payment', () => {
        test('should calculate correct saldo when anggota has credit transactions but no payments', () => {
            // Setup: Create credit transactions
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                },
                {
                    id: 'P002',
                    tanggal: '2024-01-16',
                    anggotaId: 'A001',
                    total: 50000,
                    status: 'kredit'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            // Test: Calculate saldo
            const saldo = hitungSaldoHutang('A001');
            
            // Verify: Saldo should equal total credit
            expect(saldo).toBe(150000);
        });

        test('should return 0 when anggota has no credit transactions', () => {
            localStorage.setItem('penjualan', JSON.stringify([]));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            const saldo = hitungSaldoHutang('A001');
            
            expect(saldo).toBe(0);
        });

        test('should ignore tunai transactions when calculating hutang', () => {
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                },
                {
                    id: 'P002',
                    tanggal: '2024-01-16',
                    anggotaId: 'A001',
                    total: 50000,
                    status: 'tunai'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            const saldo = hitungSaldoHutang('A001');
            
            // Should only count kredit transaction
            expect(saldo).toBe(100000);
        });
    });

    describe('Saldo Calculation After Payment', () => {
        test('should calculate correct saldo after partial payment', () => {
            // Setup: Create credit transaction and partial payment
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                }
            ];
            
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 30000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            // Test: Calculate saldo after payment
            const saldo = hitungSaldoHutang('A001');
            
            // Verify: Saldo should be credit minus payment
            expect(saldo).toBe(70000);
        });

        test('should calculate correct saldo after full payment', () => {
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                }
            ];
            
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 100000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const saldo = hitungSaldoHutang('A001');
            
            // Verify: Saldo should be 0 after full payment
            expect(saldo).toBe(0);
        });

        test('should calculate correct saldo with multiple payments', () => {
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 200000,
                    status: 'kredit'
                }
            ];
            
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 50000,
                    status: 'selesai'
                },
                {
                    id: 'PAY002',
                    tanggal: '2024-01-21T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 30000,
                    status: 'selesai'
                },
                {
                    id: 'PAY003',
                    tanggal: '2024-01-22T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 20000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const saldo = hitungSaldoHutang('A001');
            
            // Verify: 200000 - (50000 + 30000 + 20000) = 100000
            expect(saldo).toBe(100000);
        });

        test('should only count payments with status "selesai"', () => {
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                }
            ];
            
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 30000,
                    status: 'selesai'
                },
                {
                    id: 'PAY002',
                    tanggal: '2024-01-21T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 20000,
                    status: 'pending'
                },
                {
                    id: 'PAY003',
                    tanggal: '2024-01-22T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 10000,
                    status: 'dibatalkan'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const saldo = hitungSaldoHutang('A001');
            
            // Should only count the "selesai" payment
            expect(saldo).toBe(70000);
        });
    });

    describe('Total Pembayaran Calculation', () => {
        test('should calculate total pembayaran correctly', () => {
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 50000,
                    status: 'selesai'
                },
                {
                    id: 'PAY002',
                    tanggal: '2024-01-21T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 30000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const total = hitungTotalPembayaranHutang('A001');
            
            expect(total).toBe(80000);
        });

        test('should return 0 when no payments exist', () => {
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            const total = hitungTotalPembayaranHutang('A001');
            
            expect(total).toBe(0);
        });

        test('should only count hutang payments, not piutang', () => {
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 50000,
                    status: 'selesai'
                },
                {
                    id: 'PAY002',
                    tanggal: '2024-01-21T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'piutang',
                    jumlah: 30000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const total = hitungTotalPembayaranHutang('A001');
            
            // Should only count hutang payment
            expect(total).toBe(50000);
        });
    });

    describe('Payment History Retrieval', () => {
        test('should retrieve payment history for anggota', () => {
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 50000,
                    status: 'selesai',
                    kasirNama: 'Kasir 1'
                },
                {
                    id: 'PAY002',
                    tanggal: '2024-01-21T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 30000,
                    status: 'selesai',
                    kasirNama: 'Kasir 2'
                },
                {
                    id: 'PAY003',
                    tanggal: '2024-01-22T10:00:00.000Z',
                    anggotaId: 'A002',
                    jenis: 'hutang',
                    jumlah: 20000,
                    status: 'selesai',
                    kasirNama: 'Kasir 1'
                }
            ];
            
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const history = getPembayaranHutangHistory('A001');
            
            // Should only return payments for A001
            expect(history).toHaveLength(2);
            // History is sorted newest first, so PAY002 (2024-01-21) comes before PAY001 (2024-01-20)
            expect(history[0].id).toBe('PAY002');
            expect(history[1].id).toBe('PAY001');
        });

        test('should return empty array when no payment history exists', () => {
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            const history = getPembayaranHutangHistory('A001');
            
            expect(history).toEqual([]);
        });

        test('should sort payment history by date (newest first)', () => {
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 50000,
                    status: 'selesai'
                },
                {
                    id: 'PAY002',
                    tanggal: '2024-01-25T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 30000,
                    status: 'selesai'
                },
                {
                    id: 'PAY003',
                    tanggal: '2024-01-22T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 20000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const history = getPembayaranHutangHistory('A001');
            
            // Should be sorted newest first
            expect(history[0].id).toBe('PAY002'); // 2024-01-25
            expect(history[1].id).toBe('PAY003'); // 2024-01-22
            expect(history[2].id).toBe('PAY001'); // 2024-01-20
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle invalid anggotaId gracefully', () => {
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            // Test with null, undefined, empty string
            expect(hitungSaldoHutang(null)).toBe(0);
            expect(hitungSaldoHutang(undefined)).toBe(0);
            expect(hitungSaldoHutang('')).toBe(0);
        });

        test('should handle missing localStorage data', () => {
            localStorage.clear();
            
            const saldo = hitungSaldoHutang('A001');
            
            expect(saldo).toBe(0);
        });

        test('should handle corrupted localStorage data', () => {
            localStorage.setItem('penjualan', 'invalid json');
            localStorage.setItem('pembayaranHutangPiutang', 'invalid json');
            
            const saldo = hitungSaldoHutang('A001');
            
            // Should handle gracefully and return 0
            expect(saldo).toBe(0);
        });

        test('should handle overpayment scenario', () => {
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                }
            ];
            
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 150000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            const saldo = hitungSaldoHutang('A001');
            
            // Saldo can be negative (overpayment)
            expect(saldo).toBe(-50000);
        });
    });

    describe('Integration: Saldo Update After Payment', () => {
        test('should reflect updated saldo immediately after payment is recorded', () => {
            // Initial state: anggota has credit
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            // Check saldo before payment
            const saldoBefore = hitungSaldoHutang('A001');
            expect(saldoBefore).toBe(100000);
            
            // Simulate payment
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: new Date().toISOString(),
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 40000,
                    status: 'selesai'
                }
            ];
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            // Check saldo after payment
            const saldoAfter = hitungSaldoHutang('A001');
            expect(saldoAfter).toBe(60000);
            
            // Verify the difference equals payment amount
            expect(saldoBefore - saldoAfter).toBe(40000);
        });

        test('should maintain consistency across multiple anggota', () => {
            const penjualan = [
                {
                    id: 'P001',
                    tanggal: '2024-01-15',
                    anggotaId: 'A001',
                    total: 100000,
                    status: 'kredit'
                },
                {
                    id: 'P002',
                    tanggal: '2024-01-16',
                    anggotaId: 'A002',
                    total: 200000,
                    status: 'kredit'
                }
            ];
            
            const pembayaran = [
                {
                    id: 'PAY001',
                    tanggal: '2024-01-20T10:00:00.000Z',
                    anggotaId: 'A001',
                    jenis: 'hutang',
                    jumlah: 30000,
                    status: 'selesai'
                },
                {
                    id: 'PAY002',
                    tanggal: '2024-01-21T10:00:00.000Z',
                    anggotaId: 'A002',
                    jenis: 'hutang',
                    jumlah: 50000,
                    status: 'selesai'
                }
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            // Each anggota should have correct independent saldo
            expect(hitungSaldoHutang('A001')).toBe(70000);
            expect(hitungSaldoHutang('A002')).toBe(150000);
        });
    });
});
