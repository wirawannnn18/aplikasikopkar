/**
 * Test untuk Data Models sistem transformasi barang
 * 
 * Test ini memverifikasi bahwa semua data models berfungsi dengan benar
 * dan memiliki validasi yang tepat.
 */

// Import dependencies untuk testing
import fc from 'fast-check';

// Import komponen yang akan ditest
import { 
    TransformationItem, 
    TransformationRecord, 
    ConversionRatio
} from '../../js/transformasi-barang/DataModels.js';

describe('Transformasi Barang - Data Models Tests', () => {
    
    describe('TransformationItem', () => {
        test('should create valid TransformationItem', () => {
            const data = {
                id: 'AQUA-DUS',
                name: 'Aqua 1L DUS',
                unit: 'dus',
                quantity: 1,
                stockBefore: 10,
                stockAfter: 9,
                baseProduct: 'AQUA-1L'
            };

            const item = new TransformationItem(data);
            
            expect(item.id).toBe('AQUA-DUS');
            expect(item.name).toBe('Aqua 1L DUS');
            expect(item.unit).toBe('dus');
            expect(item.quantity).toBe(1);
            expect(item.stockBefore).toBe(10);
            expect(item.stockAfter).toBe(9);
            expect(item.baseProduct).toBe('AQUA-1L');
        });

        test('should validate required fields', () => {
            expect(() => new TransformationItem({})).toThrow('TransformationItem validation error');
            expect(() => new TransformationItem({ id: '', name: 'Test' })).toThrow('ID harus berupa string yang valid');
            expect(() => new TransformationItem({ id: 'test', quantity: -1 })).toThrow('Quantity harus berupa angka non-negatif');
        });

        test('should serialize and deserialize correctly', () => {
            const data = {
                id: 'TEST-001',
                name: 'Test Item',
                unit: 'pcs',
                quantity: 5,
                stockBefore: 20,
                stockAfter: 15
            };

            const item = new TransformationItem(data);
            const json = item.toJSON();
            const restored = TransformationItem.fromJSON(json);

            expect(restored.id).toBe(item.id);
            expect(restored.name).toBe(item.name);
            expect(restored.quantity).toBe(item.quantity);
        });
    });

    describe('TransformationRecord', () => {
        test('should create valid TransformationRecord', () => {
            const sourceItem = new TransformationItem({
                id: 'AQUA-DUS',
                name: 'Aqua 1L DUS',
                unit: 'dus',
                quantity: 1,
                stockBefore: 10,
                stockAfter: 9
            });

            const targetItem = new TransformationItem({
                id: 'AQUA-PCS',
                name: 'Aqua 1L PCS',
                unit: 'pcs',
                quantity: 12,
                stockBefore: 5,
                stockAfter: 17
            });

            const record = new TransformationRecord({
                user: 'kasir01',
                sourceItem,
                targetItem,
                conversionRatio: 12,
                status: 'completed'
            });

            expect(record.user).toBe('kasir01');
            expect(record.sourceItem).toBeInstanceOf(TransformationItem);
            expect(record.targetItem).toBeInstanceOf(TransformationItem);
            expect(record.conversionRatio).toBe(12);
            expect(record.status).toBe('completed');
            expect(record.id).toMatch(/^TRF-\d+-\d+$/);
        });

        test('should validate transformation record data', () => {
            const validSourceItem = new TransformationItem({
                id: 'TEST-001', name: 'Test', unit: 'pcs', 
                quantity: 1, stockBefore: 10, stockAfter: 9
            });

            expect(() => new TransformationRecord({
                user: '',
                sourceItem: validSourceItem,
                targetItem: validSourceItem,
                conversionRatio: 12
            })).toThrow('User harus berupa string yang valid');

            expect(() => new TransformationRecord({
                user: 'test',
                sourceItem: validSourceItem,
                targetItem: validSourceItem,
                conversionRatio: -1
            })).toThrow('Conversion ratio harus berupa angka positif');

            expect(() => new TransformationRecord({
                user: 'test',
                sourceItem: validSourceItem,
                targetItem: validSourceItem,
                conversionRatio: 12,
                status: 'invalid'
            })).toThrow('Status harus berupa pending, completed, atau failed');
        });
    });

    describe('ConversionRule', () => {
        test('should create valid ConversionRule', () => {
            const rule = new ConversionRule({
                from: 'dus',
                to: 'pcs',
                ratio: 12
            });

            expect(rule.from).toBe('dus');
            expect(rule.to).toBe('pcs');
            expect(rule.ratio).toBe(12);
        });

        test('should validate conversion rule data', () => {
            expect(() => new ConversionRule({
                from: '',
                to: 'pcs',
                ratio: 12
            })).toThrow('From unit harus berupa string yang valid');

            expect(() => new ConversionRule({
                from: 'dus',
                to: 'dus',
                ratio: 12
            })).toThrow('From dan To unit tidak boleh sama');

            expect(() => new ConversionRule({
                from: 'dus',
                to: 'pcs',
                ratio: 0
            })).toThrow('Ratio harus berupa angka positif');
        });
    });

    describe('ConversionRatio', () => {
        test('should create valid ConversionRatio', () => {
            const ratio = new ConversionRatio({
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 },
                    { from: 'pcs', to: 'dus', ratio: 0.0833 }
                ]
            });

            expect(ratio.baseProduct).toBe('AQUA-1L');
            expect(ratio.conversions).toHaveLength(2);
            expect(ratio.conversions[0]).toBeInstanceOf(ConversionRule);
        });

        test('should get conversion ratio correctly', () => {
            const ratio = new ConversionRatio({
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 }
                ]
            });

            expect(ratio.getRatio('dus', 'pcs')).toBe(12);
            expect(ratio.getRatio('pcs', 'dus')).toBeNull();
        });

        test('should add conversion rule', () => {
            const ratio = new ConversionRatio({
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 }
                ]
            });

            const newRule = new ConversionRule({
                from: 'pcs',
                to: 'dus',
                ratio: 0.0833
            });

            ratio.addConversionRule(newRule);
            expect(ratio.conversions).toHaveLength(2);
            expect(ratio.getRatio('pcs', 'dus')).toBe(0.0833);
        });

        test('should prevent duplicate conversion rules', () => {
            const ratio = new ConversionRatio({
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 }
                ]
            });

            const duplicateRule = new ConversionRule({
                from: 'dus',
                to: 'pcs',
                ratio: 10
            });

            expect(() => ratio.addConversionRule(duplicateRule))
                .toThrow('Conversion rule dus -> pcs sudah ada');
        });
    });

    describe('MasterBarangExtension', () => {
        test('should create valid MasterBarangExtension', () => {
            const item = new MasterBarangExtension({
                kode: 'AQUA-DUS',
                nama: 'Aqua 1L DUS',
                baseProduct: 'AQUA-1L',
                kategori: 'minuman',
                satuan: 'dus',
                stok: 10,
                hargaBeli: 12000,
                hargaJual: 13000
            });

            expect(item.kode).toBe('AQUA-DUS');
            expect(item.nama).toBe('Aqua 1L DUS');
            expect(item.baseProduct).toBe('AQUA-1L');
            expect(item.isTransformable()).toBe(true);
        });

        test('should update stock correctly', () => {
            const item = new MasterBarangExtension({
                kode: 'TEST-001',
                nama: 'Test Item',
                baseProduct: 'TEST',
                kategori: 'test',
                satuan: 'pcs',
                stok: 10,
                hargaBeli: 1000
            });

            item.updateStok(15);
            expect(item.stok).toBe(15);

            expect(() => item.updateStok(-1)).toThrow('Stok baru harus berupa angka non-negatif');
        });

        test('should create from master barang', () => {
            const masterBarang = {
                kode: 'TEST-001',
                nama: 'Test Item',
                kategori: 'test',
                satuan: 'pcs',
                stok: 10,
                hargaBeli: 1000
            };

            const extended = MasterBarangExtension.fromMasterBarang(masterBarang, 'TEST-BASE');
            
            expect(extended.kode).toBe('TEST-001');
            expect(extended.baseProduct).toBe('TEST-BASE');
            expect(extended.isTransformable()).toBe(true);
        });
    });

    describe('Property-Based Tests for Data Models', () => {
        test('TransformationItem should handle valid data consistently', () => {
            /**
             * Feature: transformasi-barang, Property 14: Invalid Data Rejection
             * Validates: Requirements 3.4
             */
            fc.assert(fc.property(
                fc.record({
                    id: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 1 }),
                    unit: fc.string({ minLength: 1 }),
                    quantity: fc.integer({ min: 0 }),
                    stockBefore: fc.integer({ min: 0 }),
                    stockAfter: fc.integer({ min: 0 })
                }),
                (validData) => {
                    const item = new TransformationItem(validData);
                    expect(item.id).toBe(validData.id);
                    expect(item.name).toBe(validData.name);
                    expect(item.unit).toBe(validData.unit);
                    expect(item.quantity).toBe(validData.quantity);
                    
                    // Test serialization round-trip
                    const json = item.toJSON();
                    const restored = TransformationItem.fromJSON(json);
                    expect(restored.id).toBe(item.id);
                    expect(restored.quantity).toBe(item.quantity);
                }
            ), { numRuns: 100 });
        });

        test('ConversionRule should validate ratios consistently', () => {
            /**
             * Feature: transformasi-barang, Property DataModel-1: Conversion ratio validation
             * Validates: Mathematical consistency of conversion ratios
             */
            fc.assert(fc.property(
                fc.string({ minLength: 1 }),
                fc.string({ minLength: 1 }),
                fc.float({ min: Math.fround(0.001), max: Math.fround(1000) }),
                (fromUnit, toUnit, ratio) => {
                    // Skip if units are the same
                    fc.pre(fromUnit !== toUnit);
                    
                    const rule = new ConversionRule({
                        from: fromUnit,
                        to: toUnit,
                        ratio: ratio
                    });
                    
                    expect(rule.from).toBe(fromUnit);
                    expect(rule.to).toBe(toUnit);
                    expect(rule.ratio).toBe(ratio);
                    expect(rule.ratio).toBeGreaterThan(0);
                }
            ), { numRuns: 100 });
        });

        test('MasterBarangExtension should handle stock updates consistently', () => {
            /**
             * Feature: transformasi-barang, Property DataModel-2: Stock update consistency
             * Validates: Stock updates maintain data integrity
             */
            fc.assert(fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 }),
                    baseProduct: fc.string({ minLength: 1 }),
                    kategori: fc.string({ minLength: 1 }),
                    satuan: fc.string({ minLength: 1 }),
                    stok: fc.integer({ min: 0, max: 1000 }),
                    hargaBeli: fc.integer({ min: 0, max: 100000 })
                }),
                fc.integer({ min: 0, max: 1000 }),
                (itemData, newStok) => {
                    const item = new MasterBarangExtension(itemData);
                    const originalStok = item.stok;
                    
                    item.updateStok(newStok);
                    expect(item.stok).toBe(newStok);
                    expect(item.stok).toBeGreaterThanOrEqual(0);
                    
                    // Other properties should remain unchanged
                    expect(item.kode).toBe(itemData.kode);
                    expect(item.nama).toBe(itemData.nama);
                    expect(item.baseProduct).toBe(itemData.baseProduct);
                }
            ), { numRuns: 100 });
        });
    });
});