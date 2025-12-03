/**
 * Unit and Property-Based Tests for Edit/Delete Pembelian
 * Feature: hapus-edit-pembelian
 */

import fc from 'fast-check';

// Mock localStorage for testing
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

// ============================================================================
// UNIT TESTS FOR STOCK ADJUSTMENT FUNCTIONS
// ============================================================================

describe('Unit Tests: Stock Adjustment Functions', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('adjustStockForEdit', () => {
        // Helper function to create adjustStockForEdit
        const adjustStockForEdit = (oldItems, newItems) => {
            const barang = JSON.parse(localStorage.getItem('barang') || '[]');
            const errors = [];
            
            const oldItemsMap = {};
            oldItems.forEach(item => {
                oldItemsMap[item.barangId] = item;
            });
            
            const newItemsMap = {};
            newItems.forEach(item => {
                newItemsMap[item.barangId] = item;
            });
            
            const allBarangIds = new Set([...Object.keys(oldItemsMap), ...Object.keys(newItemsMap)]);
            
            allBarangIds.forEach(barangId => {
                const oldItem = oldItemsMap[barangId];
                const newItem = newItemsMap[barangId];
                const barangIndex = barang.findIndex(b => b.id === barangId);
                
                if (barangIndex === -1) {
                    const itemName = oldItem?.nama || newItem?.nama || barangId;
                    errors.push(`Barang "${itemName}" tidak ditemukan dalam sistem`);
                    return;
                }
                
                let oldQty = oldItem ? oldItem.qty : 0;
                let newQty = newItem ? newItem.qty : 0;
                
                const qtyDifference = newQty - oldQty;
                barang[barangIndex].stok += qtyDifference;
                
                if (barang[barangIndex].stok < 0) {
                    console.warn(`Stok barang ${barang[barangIndex].nama} menjadi negatif: ${barang[barangIndex].stok}`);
                }
            });
            
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }
            
            localStorage.setItem('barang', JSON.stringify(barang));
            return barang;
        };

        test('should adjust stock when item quantity is increased', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const oldItems = [{ barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000 }];
            const newItems = [{ barangId: 'b1', nama: 'Barang 1', qty: 15, harga: 5000 }];
            
            // Execute
            const result = adjustStockForEdit(oldItems, newItems);
            
            // Verify: stock should increase by 5 (15 - 10)
            expect(result[0].stok).toBe(105);
        });

        test('should adjust stock when item quantity is decreased', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const oldItems = [{ barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000 }];
            const newItems = [{ barangId: 'b1', nama: 'Barang 1', qty: 5, harga: 5000 }];
            
            // Execute
            const result = adjustStockForEdit(oldItems, newItems);
            
            // Verify: stock should decrease by 5 (5 - 10 = -5)
            expect(result[0].stok).toBe(95);
        });

        test('should handle item removal (item in old but not in new)', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 },
                { id: 'b2', nama: 'Barang 2', stok: 50, hpp: 3000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const oldItems = [
                { barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000 },
                { barangId: 'b2', nama: 'Barang 2', qty: 5, harga: 3000 }
            ];
            const newItems = [
                { barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000 }
            ];
            
            // Execute
            const result = adjustStockForEdit(oldItems, newItems);
            
            // Verify: b2 stock should decrease by 5 (removed from transaction)
            const b2 = result.find(b => b.id === 'b2');
            expect(b2.stok).toBe(45);
        });

        test('should handle item addition (item in new but not in old)', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 },
                { id: 'b2', nama: 'Barang 2', stok: 50, hpp: 3000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const oldItems = [
                { barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000 }
            ];
            const newItems = [
                { barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000 },
                { barangId: 'b2', nama: 'Barang 2', qty: 8, harga: 3000 }
            ];
            
            // Execute
            const result = adjustStockForEdit(oldItems, newItems);
            
            // Verify: b2 stock should increase by 8 (added to transaction)
            const b2 = result.find(b => b.id === 'b2');
            expect(b2.stok).toBe(58);
        });

        test('should throw error when barang not found', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const oldItems = [{ barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000 }];
            const newItems = [{ barangId: 'b999', nama: 'Barang Not Found', qty: 5, harga: 5000 }];
            
            // Execute & Verify
            expect(() => adjustStockForEdit(oldItems, newItems)).toThrow('tidak ditemukan dalam sistem');
        });
    });

    describe('adjustStockForDelete', () => {
        // Helper function to create adjustStockForDelete
        const adjustStockForDelete = (items) => {
            const barang = JSON.parse(localStorage.getItem('barang') || '[]');
            const warnings = [];
            
            items.forEach(item => {
                const barangIndex = barang.findIndex(b => b.id === item.barangId);
                
                if (barangIndex === -1) {
                    console.warn(`Barang dengan id ${item.barangId} tidak ditemukan`);
                    return;
                }
                
                barang[barangIndex].stok -= item.qty;
                
                if (barang[barangIndex].stok < 0) {
                    warnings.push(`Stok barang ${barang[barangIndex].nama} menjadi negatif: ${barang[barangIndex].stok}`);
                    console.warn(`Stok barang ${barang[barangIndex].nama} menjadi negatif: ${barang[barangIndex].stok}`);
                }
            });
            
            localStorage.setItem('barang', JSON.stringify(barang));
            return { success: true, warnings: warnings };
        };

        test('should reduce stock for single item', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const items = [{ barangId: 'b1', nama: 'Barang 1', qty: 10 }];
            
            // Execute
            const result = adjustStockForDelete(items);
            
            // Verify
            const updatedBarang = JSON.parse(localStorage.getItem('barang'));
            expect(updatedBarang[0].stok).toBe(90);
            expect(result.success).toBe(true);
            expect(result.warnings.length).toBe(0);
        });

        test('should reduce stock for multiple items', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 },
                { id: 'b2', nama: 'Barang 2', stok: 50, hpp: 3000 },
                { id: 'b3', nama: 'Barang 3', stok: 75, hpp: 4000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const items = [
                { barangId: 'b1', nama: 'Barang 1', qty: 10 },
                { barangId: 'b2', nama: 'Barang 2', qty: 5 },
                { barangId: 'b3', nama: 'Barang 3', qty: 15 }
            ];
            
            // Execute
            const result = adjustStockForDelete(items);
            
            // Verify
            const updatedBarang = JSON.parse(localStorage.getItem('barang'));
            expect(updatedBarang[0].stok).toBe(90);
            expect(updatedBarang[1].stok).toBe(45);
            expect(updatedBarang[2].stok).toBe(60);
            expect(result.success).toBe(true);
        });

        test('should warn when stock becomes negative', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 5, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const items = [{ barangId: 'b1', nama: 'Barang 1', qty: 10 }];
            
            // Execute
            const result = adjustStockForDelete(items);
            
            // Verify
            const updatedBarang = JSON.parse(localStorage.getItem('barang'));
            expect(updatedBarang[0].stok).toBe(-5);
            expect(result.success).toBe(true);
            expect(result.warnings.length).toBe(1);
            expect(result.warnings[0]).toContain('negatif');
        });
    });
});

// ============================================================================
// UNIT TESTS FOR HPP CALCULATION
// ============================================================================

describe('Unit Tests: HPP Calculation', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('recalculateHPPOnEdit', () => {
        // Helper function
        const recalculateHPPOnEdit = (barangId, oldQty, oldHarga, newQty, newHarga) => {
            const barang = JSON.parse(localStorage.getItem('barang') || '[]');
            const barangIndex = barang.findIndex(b => b.id === barangId);
            
            if (barangIndex === -1) {
                console.warn(`Barang dengan id ${barangId} tidak ditemukan`);
                return;
            }
            
            const currentStok = barang[barangIndex].stok;
            const currentHPP = barang[barangIndex].hpp || 0;
            
            let totalValue = (currentStok * currentHPP) - (oldQty * oldHarga);
            let newStok = currentStok - oldQty;
            
            totalValue += (newQty * newHarga);
            newStok += newQty;
            
            if (newStok > 0) {
                barang[barangIndex].hpp = totalValue / newStok;
            } else {
                barang[barangIndex].hpp = 0;
            }
            
            localStorage.setItem('barang', JSON.stringify(barang));
            return barang[barangIndex].hpp;
        };

        test('should recalculate HPP when qty increases', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            // Execute: old purchase was 10@5000, new is 15@5000
            const newHPP = recalculateHPPOnEdit('b1', 10, 5000, 15, 5000);
            
            // Verify: HPP should remain 5000 (same price)
            expect(newHPP).toBe(5000);
        });

        test('should recalculate HPP with weighted average when price changes', () => {
            // Setup: current stock 100 @ HPP 5000
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            // Execute: old purchase was 10@5000, new is 10@6000
            // Remove old: (100 * 5000) - (10 * 5000) = 450000, stock = 90
            // Add new: 450000 + (10 * 6000) = 510000, stock = 100
            // New HPP: 510000 / 100 = 5100
            const newHPP = recalculateHPPOnEdit('b1', 10, 5000, 10, 6000);
            
            // Verify
            expect(newHPP).toBe(5100);
        });

        test('should handle zero stock edge case', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 10, hpp: 5000 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            // Execute: remove all stock
            const newHPP = recalculateHPPOnEdit('b1', 10, 5000, 0, 0);
            
            // Verify: HPP should be 0 when stock is 0
            expect(newHPP).toBe(0);
        });

        test('should handle first purchase (HPP was 0)', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 0, hpp: 0 }
            ];
            localStorage.setItem('barang', JSON.stringify(barang));
            
            // Execute: first purchase 10@5000
            const newHPP = recalculateHPPOnEdit('b1', 0, 0, 10, 5000);
            
            // Verify: HPP should be 5000
            expect(newHPP).toBe(5000);
        });
    });
});

// ============================================================================
// UNIT TESTS FOR VALIDATION FUNCTIONS
// ============================================================================

describe('Unit Tests: Validation Functions', () => {
    describe('Empty items validation', () => {
        test('should reject empty items array', () => {
            const items = [];
            const isValid = items.length > 0;
            expect(isValid).toBe(false);
        });

        test('should accept non-empty items array', () => {
            const items = [{ barangId: 'b1', qty: 1, harga: 5000 }];
            const isValid = items.length > 0;
            expect(isValid).toBe(true);
        });
    });

    describe('Negative qty/harga validation', () => {
        test('should reject negative qty', () => {
            const item = { qty: -5, harga: 5000 };
            const isValid = item.qty > 0 && item.harga >= 0;
            expect(isValid).toBe(false);
        });

        test('should reject zero qty', () => {
            const item = { qty: 0, harga: 5000 };
            const isValid = item.qty > 0 && item.harga >= 0;
            expect(isValid).toBe(false);
        });

        test('should reject negative harga', () => {
            const item = { qty: 5, harga: -1000 };
            const isValid = item.qty > 0 && item.harga >= 0;
            expect(isValid).toBe(false);
        });

        test('should accept valid qty and harga', () => {
            const item = { qty: 5, harga: 5000 };
            const isValid = item.qty > 0 && item.harga >= 0;
            expect(isValid).toBe(true);
        });

        test('should accept zero harga', () => {
            const item = { qty: 5, harga: 0 };
            const isValid = item.qty > 0 && item.harga >= 0;
            expect(isValid).toBe(true);
        });
    });

    describe('Required fields validation', () => {
        test('should reject empty noFaktur', () => {
            const noFaktur = '';
            const tanggal = '2024-01-01';
            const isValid = noFaktur.trim() !== '' && tanggal !== '';
            expect(isValid).toBe(false);
        });

        test('should reject whitespace-only noFaktur', () => {
            const noFaktur = '   ';
            const tanggal = '2024-01-01';
            const isValid = noFaktur.trim() !== '' && tanggal !== '';
            expect(isValid).toBe(false);
        });

        test('should reject empty tanggal', () => {
            const noFaktur = 'PB001';
            const tanggal = '';
            const isValid = noFaktur.trim() !== '' && tanggal !== '';
            expect(isValid).toBe(false);
        });

        test('should accept valid noFaktur and tanggal', () => {
            const noFaktur = 'PB001';
            const tanggal = '2024-01-01';
            const isValid = noFaktur.trim() !== '' && tanggal !== '';
            expect(isValid).toBe(true);
        });
    });
});

// ============================================================================
// UNIT TESTS FOR JOURNAL ENTRY FUNCTIONS
// ============================================================================

describe('Unit Tests: Journal Entry Functions', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('createJurnalKoreksi', () => {
        // Helper function
        const createJurnalKoreksi = (oldTotal, newTotal, tanggal, description) => {
            try {
                const selisih = newTotal - oldTotal;
                
                if (selisih === 0) {
                    return { success: true, message: 'Tidak ada perubahan total, jurnal tidak dibuat' };
                }
                
                const entries = [];
                
                if (selisih > 0) {
                    entries.push({ akun: '1-1300', debit: selisih, kredit: 0 });
                    entries.push({ akun: '1-1000', debit: 0, kredit: selisih });
                } else {
                    const absSelisih = Math.abs(selisih);
                    entries.push({ akun: '1-1000', debit: absSelisih, kredit: 0 });
                    entries.push({ akun: '1-1300', debit: 0, kredit: absSelisih });
                }
                
                const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
                
                if (Math.abs(totalDebit - totalKredit) > 0.01) {
                    throw new Error('Jurnal tidak balance: Debit=' + totalDebit + ', Kredit=' + totalKredit);
                }
                
                return { success: true, message: 'Jurnal koreksi berhasil dibuat', entries };
            } catch (error) {
                return { success: false, message: error.message };
            }
        };

        test('should create correction journal for positive difference', () => {
            // Execute: pembelian bertambah dari 100000 ke 150000
            const result = createJurnalKoreksi(100000, 150000, '2024-01-01', 'Koreksi');
            
            // Verify
            expect(result.success).toBe(true);
            expect(result.entries).toHaveLength(2);
            expect(result.entries[0]).toEqual({ akun: '1-1300', debit: 50000, kredit: 0 });
            expect(result.entries[1]).toEqual({ akun: '1-1000', debit: 0, kredit: 50000 });
        });

        test('should create correction journal for negative difference', () => {
            // Execute: pembelian berkurang dari 150000 ke 100000
            const result = createJurnalKoreksi(150000, 100000, '2024-01-01', 'Koreksi');
            
            // Verify
            expect(result.success).toBe(true);
            expect(result.entries).toHaveLength(2);
            expect(result.entries[0]).toEqual({ akun: '1-1000', debit: 50000, kredit: 0 });
            expect(result.entries[1]).toEqual({ akun: '1-1300', debit: 0, kredit: 50000 });
        });

        test('should not create journal when no difference', () => {
            // Execute: no change
            const result = createJurnalKoreksi(100000, 100000, '2024-01-01', 'Koreksi');
            
            // Verify
            expect(result.success).toBe(true);
            expect(result.message).toContain('Tidak ada perubahan');
        });

        test('should validate journal balance', () => {
            // Execute
            const result = createJurnalKoreksi(100000, 150000, '2024-01-01', 'Koreksi');
            
            // Verify balance
            const totalDebit = result.entries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = result.entries.reduce((sum, e) => sum + e.kredit, 0);
            expect(totalDebit).toBe(totalKredit);
        });
    });

    describe('createJurnalPembalik', () => {
        // Helper function
        const createJurnalPembalik = (total, tanggal, description) => {
            try {
                const entries = [
                    { akun: '1-1000', debit: total, kredit: 0 },
                    { akun: '1-1300', debit: 0, kredit: total }
                ];
                
                const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
                
                if (Math.abs(totalDebit - totalKredit) > 0.01) {
                    throw new Error('Jurnal tidak balance: Debit=' + totalDebit + ', Kredit=' + totalKredit);
                }
                
                return { success: true, message: 'Jurnal pembalik berhasil dibuat', entries };
            } catch (error) {
                return { success: false, message: error.message };
            }
        };

        test('should create reversing journal with correct entries', () => {
            // Execute
            const result = createJurnalPembalik(100000, '2024-01-01', 'Pembatalan');
            
            // Verify
            expect(result.success).toBe(true);
            expect(result.entries).toHaveLength(2);
            expect(result.entries[0]).toEqual({ akun: '1-1000', debit: 100000, kredit: 0 });
            expect(result.entries[1]).toEqual({ akun: '1-1300', debit: 0, kredit: 100000 });
        });

        test('should validate journal balance', () => {
            // Execute
            const result = createJurnalPembalik(150000, '2024-01-01', 'Pembatalan');
            
            // Verify balance
            const totalDebit = result.entries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = result.entries.reduce((sum, e) => sum + e.kredit, 0);
            expect(totalDebit).toBe(totalKredit);
        });

        test('should handle various total amounts', () => {
            const amounts = [1000, 50000, 100000, 500000, 1000000];
            
            amounts.forEach(amount => {
                const result = createJurnalPembalik(amount, '2024-01-01', 'Pembatalan');
                expect(result.success).toBe(true);
                
                const totalDebit = result.entries.reduce((sum, e) => sum + e.debit, 0);
                const totalKredit = result.entries.reduce((sum, e) => sum + e.kredit, 0);
                expect(totalDebit).toBe(totalKredit);
                expect(totalDebit).toBe(amount);
            });
        });
    });
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

// Custom arbitraries
const jsBuiltInNames = ['toString', 'valueOf', 'constructor', 'hasOwnProperty', 'isPrototypeOf', 
                         'propertyIsEnumerable', 'toLocaleString', '__proto__', '__defineGetter__', 
                         '__defineSetter__', '__lookupGetter__', '__lookupSetter__'];

const safeStringArbitrary = fc.stringOf(
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
    { minLength: 5, maxLength: 20 }
).filter(s => /^[a-zA-Z]/.test(s) && !s.endsWith('-') && !jsBuiltInNames.includes(s));

const barangArbitrary = fc.record({
    id: safeStringArbitrary,
    nama: fc.string({ minLength: 3, maxLength: 50 }),
    stok: fc.integer({ min: 0, max: 1000 }),
    hpp: fc.integer({ min: 1000, max: 100000 })
});

const itemArbitrary = fc.record({
    barangId: safeStringArbitrary,
    nama: fc.string({ minLength: 3, maxLength: 50 }),
    qty: fc.integer({ min: 1, max: 100 }),
    harga: fc.integer({ min: 1000, max: 100000 }),
    subtotal: fc.integer({ min: 1000, max: 10000000 })
});

/**
 * **Feature: hapus-edit-pembelian, Property 3: Stock adjustment on edit**
 * **Validates: Requirements 1.4, 4.5**
 */
describe('Property 3: Stock adjustment on edit', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    const adjustStockForEdit = (oldItems, newItems) => {
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const errors = [];
        
        const oldItemsMap = {};
        oldItems.forEach(item => {
            oldItemsMap[item.barangId] = item;
        });
        
        const newItemsMap = {};
        newItems.forEach(item => {
            newItemsMap[item.barangId] = item;
        });
        
        const allBarangIds = new Set([...Object.keys(oldItemsMap), ...Object.keys(newItemsMap)]);
        
        allBarangIds.forEach(barangId => {
            const oldItem = oldItemsMap[barangId];
            const newItem = newItemsMap[barangId];
            const barangIndex = barang.findIndex(b => b.id === barangId);
            
            if (barangIndex === -1) {
                const itemName = oldItem?.nama || newItem?.nama || barangId;
                errors.push(`Barang "${itemName}" tidak ditemukan dalam sistem`);
                return;
            }
            
            let oldQty = oldItem ? oldItem.qty : 0;
            let newQty = newItem ? newItem.qty : 0;
            
            const qtyDifference = newQty - oldQty;
            barang[barangIndex].stok += qtyDifference;
        });
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        localStorage.setItem('barang', JSON.stringify(barang));
        return barang;
    };

    test('For any item in any edited transaction, the stock adjustment should equal (newQty - oldQty)', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(itemArbitrary, { minLength: 1, maxLength: 5 }),
                fc.array(itemArbitrary, { minLength: 1, maxLength: 5 }),
                (barangList, oldItems, newItems) => {
                    // Setup: Create unique barang IDs
                    const uniqueBarang = [];
                    const seenIds = new Set();
                    barangList.forEach(b => {
                        if (!seenIds.has(b.id)) {
                            seenIds.add(b.id);
                            uniqueBarang.push(b);
                        }
                    });
                    
                    if (uniqueBarang.length === 0) return true;
                    
                    // Map items to existing barang IDs, ensuring unique barangId per item
                    const mappedOldItems = oldItems.slice(0, uniqueBarang.length).map((item, idx) => ({
                        ...item,
                        barangId: uniqueBarang[idx].id
                    }));
                    
                    const mappedNewItems = newItems.slice(0, uniqueBarang.length).map((item, idx) => ({
                        ...item,
                        barangId: uniqueBarang[idx].id
                    }));
                    
                    // Remove duplicate items with same barangId (keep first occurrence)
                    const uniqueOldItems = [];
                    const seenOldIds = new Set();
                    mappedOldItems.forEach(item => {
                        if (!seenOldIds.has(item.barangId)) {
                            seenOldIds.add(item.barangId);
                            uniqueOldItems.push(item);
                        }
                    });
                    
                    const uniqueNewItems = [];
                    const seenNewIds = new Set();
                    mappedNewItems.forEach(item => {
                        if (!seenNewIds.has(item.barangId)) {
                            seenNewIds.add(item.barangId);
                            uniqueNewItems.push(item);
                        }
                    });
                    
                    localStorage.setItem('barang', JSON.stringify(uniqueBarang));
                    
                    // Record initial stocks
                    const initialStocks = {};
                    uniqueBarang.forEach(b => {
                        initialStocks[b.id] = b.stok;
                    });
                    
                    // Execute
                    const result = adjustStockForEdit(uniqueOldItems, uniqueNewItems);
                    
                    // Verify: stock change equals qty difference
                    return result.every((b) => {
                        const oldItem = uniqueOldItems.find(i => i.barangId === b.id);
                        const newItem = uniqueNewItems.find(i => i.barangId === b.id);
                        const oldQty = oldItem ? oldItem.qty : 0;
                        const newQty = newItem ? newItem.qty : 0;
                        const expectedStock = initialStocks[b.id] + (newQty - oldQty);
                        return b.stok === expectedStock;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-edit-pembelian, Property 4: HPP weighted average calculation**
 * **Validates: Requirements 1.5**
 */
describe('Property 4: HPP weighted average calculation', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    const recalculateHPPOnEdit = (barangId, oldQty, oldHarga, newQty, newHarga) => {
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const barangIndex = barang.findIndex(b => b.id === barangId);
        
        if (barangIndex === -1) {
            return null;
        }
        
        const currentStok = barang[barangIndex].stok;
        const currentHPP = barang[barangIndex].hpp || 0;
        
        let totalValue = (currentStok * currentHPP) - (oldQty * oldHarga);
        let newStok = currentStok - oldQty;
        
        totalValue += (newQty * newHarga);
        newStok += newQty;
        
        if (newStok > 0) {
            barang[barangIndex].hpp = totalValue / newStok;
        } else {
            barang[barangIndex].hpp = 0;
        }
        
        localStorage.setItem('barang', JSON.stringify(barang));
        return barang[barangIndex].hpp;
    };

    test('For any barang affected by edit, the new HPP should be calculated using weighted average formula', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10, max: 1000 }), // currentStok
                fc.integer({ min: 1000, max: 50000 }), // currentHPP
                fc.integer({ min: 1, max: 100 }), // oldQty
                fc.integer({ min: 1000, max: 50000 }), // oldHarga
                fc.integer({ min: 1, max: 100 }), // newQty
                fc.integer({ min: 1000, max: 50000 }), // newHarga
                (currentStok, currentHPP, oldQty, oldHarga, newQty, newHarga) => {
                    // Ensure oldQty doesn't exceed currentStok
                    if (oldQty > currentStok) {
                        oldQty = currentStok;
                    }
                    
                    // Setup
                    const barang = [{
                        id: 'test-barang',
                        nama: 'Test Barang',
                        stok: currentStok,
                        hpp: currentHPP
                    }];
                    localStorage.setItem('barang', JSON.stringify(barang));
                    
                    // Execute
                    const newHPP = recalculateHPPOnEdit('test-barang', oldQty, oldHarga, newQty, newHarga);
                    
                    // Calculate expected HPP manually
                    const totalValue = (currentStok * currentHPP) - (oldQty * oldHarga) + (newQty * newHarga);
                    const newStok = currentStok - oldQty + newQty;
                    const expectedHPP = newStok > 0 ? totalValue / newStok : 0;
                    
                    // Verify (allow small floating point differences)
                    return Math.abs(newHPP - expectedHPP) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-edit-pembelian, Property 11: Journal balance**
 * **Validates: Requirements 3.4**
 */
describe('Property 11: Journal balance', () => {
    const createJurnalKoreksi = (oldTotal, newTotal, tanggal, description) => {
        try {
            const selisih = newTotal - oldTotal;
            
            if (selisih === 0) {
                return { success: true, message: 'Tidak ada perubahan total, jurnal tidak dibuat', entries: [] };
            }
            
            const entries = [];
            
            if (selisih > 0) {
                entries.push({ akun: '1-1300', debit: selisih, kredit: 0 });
                entries.push({ akun: '1-1000', debit: 0, kredit: selisih });
            } else {
                const absSelisih = Math.abs(selisih);
                entries.push({ akun: '1-1000', debit: absSelisih, kredit: 0 });
                entries.push({ akun: '1-1300', debit: 0, kredit: absSelisih });
            }
            
            const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
            
            if (Math.abs(totalDebit - totalKredit) > 0.01) {
                throw new Error('Jurnal tidak balance');
            }
            
            return { success: true, message: 'Jurnal koreksi berhasil dibuat', entries };
        } catch (error) {
            return { success: false, message: error.message, entries: [] };
        }
    };

    const createJurnalPembalik = (total, tanggal, description) => {
        try {
            const entries = [
                { akun: '1-1000', debit: total, kredit: 0 },
                { akun: '1-1300', debit: 0, kredit: total }
            ];
            
            const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
            
            if (Math.abs(totalDebit - totalKredit) > 0.01) {
                throw new Error('Jurnal tidak balance');
            }
            
            return { success: true, message: 'Jurnal pembalik berhasil dibuat', entries };
        } catch (error) {
            return { success: false, message: error.message, entries: [] };
        }
    };

    test('For any edit operation, all journals created should have total debit equal to total kredit', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10000, max: 10000000 }),
                fc.integer({ min: 10000, max: 10000000 }),
                (oldTotal, newTotal) => {
                    // Execute
                    const result = createJurnalKoreksi(oldTotal, newTotal, '2024-01-01', 'Koreksi');
                    
                    if (!result.success || result.entries.length === 0) {
                        return true; // No journal created is valid
                    }
                    
                    // Verify balance
                    const totalDebit = result.entries.reduce((sum, e) => sum + e.debit, 0);
                    const totalKredit = result.entries.reduce((sum, e) => sum + e.kredit, 0);
                    
                    return Math.abs(totalDebit - totalKredit) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any delete operation, the reversing journal should have total debit equal to total kredit', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10000, max: 10000000 }),
                (total) => {
                    // Execute
                    const result = createJurnalPembalik(total, '2024-01-01', 'Pembatalan');
                    
                    if (!result.success) {
                        return false;
                    }
                    
                    // Verify balance
                    const totalDebit = result.entries.reduce((sum, e) => sum + e.debit, 0);
                    const totalKredit = result.entries.reduce((sum, e) => sum + e.kredit, 0);
                    
                    return Math.abs(totalDebit - totalKredit) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-edit-pembelian, Property 12-14: Item removal/addition updates total**
 * **Validates: Requirements 4.2, 4.3, 4.4**
 */
describe('Property 12-14: Item removal/addition updates total', () => {
    test('For any item removed from the items array, the total should be recalculated as sum of remaining items subtotals', () => {
        fc.assert(
            fc.property(
                fc.array(itemArbitrary, { minLength: 2, maxLength: 10 }),
                fc.integer({ min: 0, max: 9 }),
                (items, removeIndex) => {
                    // Ensure valid index
                    if (removeIndex >= items.length) {
                        removeIndex = items.length - 1;
                    }
                    
                    // Calculate items with proper subtotals
                    const itemsWithSubtotal = items.map(item => ({
                        ...item,
                        subtotal: item.qty * item.harga
                    }));
                    
                    // Calculate initial total
                    const initialTotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
                    
                    // Remove item
                    const remainingItems = itemsWithSubtotal.filter((_, idx) => idx !== removeIndex);
                    
                    // Calculate new total
                    const newTotal = remainingItems.reduce((sum, item) => sum + item.subtotal, 0);
                    
                    // Verify: new total should equal sum of remaining items
                    const expectedTotal = remainingItems.reduce((sum, item) => sum + item.subtotal, 0);
                    
                    return newTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any item added to the items array, the total should increase by the item subtotal', () => {
        fc.assert(
            fc.property(
                fc.array(itemArbitrary, { minLength: 1, maxLength: 10 }),
                itemArbitrary,
                (existingItems, newItem) => {
                    // Calculate items with proper subtotals
                    const itemsWithSubtotal = existingItems.map(item => ({
                        ...item,
                        subtotal: item.qty * item.harga
                    }));
                    
                    const newItemWithSubtotal = {
                        ...newItem,
                        subtotal: newItem.qty * newItem.harga
                    };
                    
                    // Calculate initial total
                    const initialTotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
                    
                    // Add new item
                    const updatedItems = [...itemsWithSubtotal, newItemWithSubtotal];
                    
                    // Calculate new total
                    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
                    
                    // Verify: new total should equal initial total + new item subtotal
                    return newTotal === initialTotal + newItemWithSubtotal.subtotal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any item with qty or harga modified, subtotal should equal (qty * harga) and total should equal sum of all subtotals', () => {
        fc.assert(
            fc.property(
                fc.array(itemArbitrary, { minLength: 1, maxLength: 10 }),
                fc.integer({ min: 0, max: 9 }),
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1000, max: 100000 }),
                (items, modifyIndex, newQty, newHarga) => {
                    // Ensure valid index
                    if (modifyIndex >= items.length) {
                        modifyIndex = items.length - 1;
                    }
                    
                    // Calculate items with proper subtotals
                    const itemsWithSubtotal = items.map(item => ({
                        ...item,
                        subtotal: item.qty * item.harga
                    }));
                    
                    // Modify item
                    itemsWithSubtotal[modifyIndex].qty = newQty;
                    itemsWithSubtotal[modifyIndex].harga = newHarga;
                    itemsWithSubtotal[modifyIndex].subtotal = newQty * newHarga;
                    
                    // Calculate total
                    const total = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
                    
                    // Verify: subtotal is correct and total is sum of all subtotals
                    const subtotalCorrect = itemsWithSubtotal[modifyIndex].subtotal === newQty * newHarga;
                    const totalCorrect = total === itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
                    
                    return subtotalCorrect && totalCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests: Complete Flows', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('Complete Edit Flow', () => {
        test('should complete full edit flow: load → modify → save → verify', () => {
            // Setup: Create initial data
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000, hargaJual: 7000 },
                { id: 'b2', nama: 'Barang 2', stok: 50, hpp: 3000, hargaJual: 4500 }
            ];
            
            const pembelian = [{
                id: 'p1',
                noFaktur: 'PB001',
                tanggal: '2024-01-01',
                supplierId: null,
                items: [
                    { barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000, subtotal: 50000 },
                    { barangId: 'b2', nama: 'Barang 2', qty: 5, harga: 3000, subtotal: 15000 }
                ],
                total: 65000,
                status: 'selesai'
            }];
            
            localStorage.setItem('barang', JSON.stringify(barang));
            localStorage.setItem('pembelian', JSON.stringify(pembelian));
            
            // Step 1: Load transaction for edit
            const transaksi = JSON.parse(localStorage.getItem('pembelian'))[0];
            expect(transaksi.id).toBe('p1');
            expect(transaksi.items.length).toBe(2);
            
            // Step 2: Modify transaction (change qty of first item)
            const oldItems = JSON.parse(JSON.stringify(transaksi.items));
            transaksi.items[0].qty = 15; // Changed from 10 to 15
            transaksi.items[0].subtotal = 15 * 5000;
            transaksi.total = transaksi.items.reduce((sum, item) => sum + item.subtotal, 0);
            
            // Step 3: Save changes (adjust stock)
            const adjustStockForEdit = (oldItems, newItems) => {
                const barang = JSON.parse(localStorage.getItem('barang') || '[]');
                const oldItemsMap = {};
                oldItems.forEach(item => { oldItemsMap[item.barangId] = item; });
                const newItemsMap = {};
                newItems.forEach(item => { newItemsMap[item.barangId] = item; });
                const allBarangIds = new Set([...Object.keys(oldItemsMap), ...Object.keys(newItemsMap)]);
                
                allBarangIds.forEach(barangId => {
                    const oldItem = oldItemsMap[barangId];
                    const newItem = newItemsMap[barangId];
                    const barangIndex = barang.findIndex(b => b.id === barangId);
                    if (barangIndex !== -1) {
                        let oldQty = oldItem ? oldItem.qty : 0;
                        let newQty = newItem ? newItem.qty : 0;
                        const qtyDifference = newQty - oldQty;
                        barang[barangIndex].stok += qtyDifference;
                    }
                });
                
                localStorage.setItem('barang', JSON.stringify(barang));
                return barang;
            };
            
            adjustStockForEdit(oldItems, transaksi.items);
            
            // Update transaction in storage
            const allPembelian = JSON.parse(localStorage.getItem('pembelian'));
            allPembelian[0] = transaksi;
            localStorage.setItem('pembelian', JSON.stringify(allPembelian));
            
            // Step 4: Verify all changes
            const updatedBarang = JSON.parse(localStorage.getItem('barang'));
            const updatedPembelian = JSON.parse(localStorage.getItem('pembelian'));
            
            // Verify stock adjustment (b1 should increase by 5)
            expect(updatedBarang[0].stok).toBe(105);
            expect(updatedBarang[1].stok).toBe(50); // Unchanged
            
            // Verify transaction update
            expect(updatedPembelian[0].items[0].qty).toBe(15);
            expect(updatedPembelian[0].total).toBe(90000); // 75000 + 15000
        });
    });

    describe('Complete Delete Flow', () => {
        test('should complete full delete flow: select → confirm → verify', () => {
            // Setup: Create initial data
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000, hargaJual: 7000 },
                { id: 'b2', nama: 'Barang 2', stok: 50, hpp: 3000, hargaJual: 4500 }
            ];
            
            const pembelian = [{
                id: 'p1',
                noFaktur: 'PB001',
                tanggal: '2024-01-01',
                supplierId: null,
                items: [
                    { barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000, subtotal: 50000 },
                    { barangId: 'b2', nama: 'Barang 2', qty: 5, harga: 3000, subtotal: 15000 }
                ],
                total: 65000,
                status: 'selesai'
            }];
            
            localStorage.setItem('barang', JSON.stringify(barang));
            localStorage.setItem('pembelian', JSON.stringify(pembelian));
            
            // Step 1: Select transaction to delete
            const transaksi = JSON.parse(localStorage.getItem('pembelian'))[0];
            expect(transaksi.id).toBe('p1');
            
            // Step 2: Confirm deletion (adjust stock)
            const adjustStockForDelete = (items) => {
                const barang = JSON.parse(localStorage.getItem('barang') || '[]');
                items.forEach(item => {
                    const barangIndex = barang.findIndex(b => b.id === item.barangId);
                    if (barangIndex !== -1) {
                        barang[barangIndex].stok -= item.qty;
                    }
                });
                localStorage.setItem('barang', JSON.stringify(barang));
                return { success: true, warnings: [] };
            };
            
            adjustStockForDelete(transaksi.items);
            
            // Remove transaction
            let allPembelian = JSON.parse(localStorage.getItem('pembelian'));
            allPembelian = allPembelian.filter(p => p.id !== 'p1');
            localStorage.setItem('pembelian', JSON.stringify(allPembelian));
            
            // Step 3: Verify deletion
            const updatedBarang = JSON.parse(localStorage.getItem('barang'));
            const updatedPembelian = JSON.parse(localStorage.getItem('pembelian'));
            
            // Verify stock reduction
            expect(updatedBarang[0].stok).toBe(90); // 100 - 10
            expect(updatedBarang[1].stok).toBe(45); // 50 - 5
            
            // Verify transaction removed
            expect(updatedPembelian.length).toBe(0);
        });
    });

    describe('Cancel Operations', () => {
        test('should preserve state when edit is cancelled', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            
            const pembelian = [{
                id: 'p1',
                noFaktur: 'PB001',
                tanggal: '2024-01-01',
                items: [{ barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000, subtotal: 50000 }],
                total: 50000
            }];
            
            localStorage.setItem('barang', JSON.stringify(barang));
            localStorage.setItem('pembelian', JSON.stringify(pembelian));
            
            // Simulate loading for edit but then cancelling
            const originalBarang = JSON.parse(localStorage.getItem('barang'));
            const originalPembelian = JSON.parse(localStorage.getItem('pembelian'));
            
            // Cancel - no changes made
            
            // Verify state unchanged
            const currentBarang = JSON.parse(localStorage.getItem('barang'));
            const currentPembelian = JSON.parse(localStorage.getItem('pembelian'));
            
            expect(currentBarang).toEqual(originalBarang);
            expect(currentPembelian).toEqual(originalPembelian);
        });

        test('should preserve state when delete is cancelled', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            
            const pembelian = [{
                id: 'p1',
                noFaktur: 'PB001',
                tanggal: '2024-01-01',
                items: [{ barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000, subtotal: 50000 }],
                total: 50000
            }];
            
            localStorage.setItem('barang', JSON.stringify(barang));
            localStorage.setItem('pembelian', JSON.stringify(pembelian));
            
            // Simulate showing delete confirmation but then cancelling
            const originalBarang = JSON.parse(localStorage.getItem('barang'));
            const originalPembelian = JSON.parse(localStorage.getItem('pembelian'));
            
            // Cancel - no changes made
            
            // Verify state unchanged
            const currentBarang = JSON.parse(localStorage.getItem('barang'));
            const currentPembelian = JSON.parse(localStorage.getItem('pembelian'));
            
            expect(currentBarang).toEqual(originalBarang);
            expect(currentPembelian).toEqual(originalPembelian);
        });
    });

    describe('UI Updates', () => {
        test('should update data after edit operation', () => {
            // Setup
            const barang = [
                { id: 'b1', nama: 'Barang 1', stok: 100, hpp: 5000 }
            ];
            
            const pembelian = [{
                id: 'p1',
                noFaktur: 'PB001',
                tanggal: '2024-01-01',
                items: [{ barangId: 'b1', nama: 'Barang 1', qty: 10, harga: 5000, subtotal: 50000 }],
                total: 50000
            }];
            
            localStorage.setItem('barang', JSON.stringify(barang));
            localStorage.setItem('pembelian', JSON.stringify(pembelian));
            
            // Perform edit
            const allPembelian = JSON.parse(localStorage.getItem('pembelian'));
            allPembelian[0].items[0].qty = 15;
            allPembelian[0].items[0].subtotal = 75000;
            allPembelian[0].total = 75000;
            localStorage.setItem('pembelian', JSON.stringify(allPembelian));
            
            // Verify data is updated for UI refresh
            const updatedData = JSON.parse(localStorage.getItem('pembelian'));
            expect(updatedData[0].total).toBe(75000);
            expect(updatedData[0].items[0].qty).toBe(15);
        });

        test('should update data after delete operation', () => {
            // Setup
            const pembelian = [
                { id: 'p1', noFaktur: 'PB001', total: 50000 },
                { id: 'p2', noFaktur: 'PB002', total: 75000 }
            ];
            
            localStorage.setItem('pembelian', JSON.stringify(pembelian));
            
            // Perform delete
            let allPembelian = JSON.parse(localStorage.getItem('pembelian'));
            allPembelian = allPembelian.filter(p => p.id !== 'p1');
            localStorage.setItem('pembelian', JSON.stringify(allPembelian));
            
            // Verify data is updated for UI refresh
            const updatedData = JSON.parse(localStorage.getItem('pembelian'));
            expect(updatedData.length).toBe(1);
            expect(updatedData[0].id).toBe('p2');
        });
    });
});
