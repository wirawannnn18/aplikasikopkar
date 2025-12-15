/**
 * Property-based tests untuk Negative Stock Prevention - Transformasi Barang
 * 
 * Property 13: Negative Stock Prevention
 * Validates: Requirements 3.3
 */

import fc from 'fast-check';

// Import ValidationEngine
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';

// Mock localStorage untuk testing
const mockLocalStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
};

// Setup localStorage mock
if (typeof global !== 'undefined') {
    global.localStorage = mockLocalStorage;
} else if (typeof window !== 'undefined') {
    window.localStorage = mockLocalStorage;
}

describe('Feature: transformasi-barang, Property 13: Negative Stock Prevention', () => {
    
    let validator;
    
    beforeEach(() => {
        validator = new ValidationEngine();
        validator.initialize();
        
        // Setup sample master barang data
        const sampleMasterBarang = [
            {
                kode: 'AQUA-DUS',
                nama: 'Aqua 1L DUS',
                baseProduct: 'AQUA-1L',
                satuan: 'dus',
                stok: 10,
                kategori: 'minuman'
            },
            {
                kode: 'AQUA-PCS',
                nama: 'Aqua 1L PCS',
                baseProduct: 'AQUA-1L',
                satuan: 'pcs',
                stok: 50,
                kategori: 'minuman'
            }
        ];
        
        localStorage.setItem('masterBarang', JSON.stringify(sampleMasterBarang));
        
        // Setup sample conversion ratios
        const sampleRatios = [
            {
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 },
                    { from: 'pcs', to: 'dus', ratio: 1/12 }
                ]
            }
        ];
        
        localStorage.setItem('conversionRatios', JSON.stringify(sampleRatios));
    });

    // Generator untuk transformation request yang akan menghasilkan stok negatif
    const negativeStockRequestArb = fc.record({
        sourceItemId: fc.constant('AQUA-DUS'),
        targetItemId: fc.constant('AQUA-PCS'),
        sourceQuantity: fc.integer({ min: 11, max: 100 }), // More than available stock (10)
        user: fc.string({ minLength: 3 })
    });

    // Generator untuk transformation request yang tidak akan menghasilkan stok negatif
    const validStockRequestArb = fc.record({
        sourceItemId: fc.constant('AQUA-DUS'),
        targetItemId: fc.constant('AQUA-PCS'),
        sourceQuantity: fc.integer({ min: 1, max: 10 }), // Within available stock
        user: fc.string({ minLength: 3 })
    });

    // Generator untuk item dengan stok yang bervariasi
    const itemWithVariousStockArb = fc.record({
        kode: fc.string({ minLength: 1 }),
        nama: fc.string({ minLength: 1 }),
        baseProduct: fc.string({ minLength: 1 }),
        satuan: fc.string({ minLength: 1 }),
        stok: fc.integer({ min: 0, max: 100 }),
        kategori: fc.string({ minLength: 1 })
    });

    test('Property 13.1: Transformation that would result in negative stock should be rejected', () => {
        fc.assert(fc.property(negativeStockRequestArb, async (request) => {
            const result = await validator.validateTransformationRequest(request);
            
            // Should be invalid because it would result in negative stock
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            
            // Should have specific error about insufficient stock or negative stock
            const hasStockError = result.errors.some(error => 
                error.includes('tidak mencukupi') || 
                error.includes('negatif') ||
                error.includes('habis')
            );
            expect(hasStockError).toBe(true);
        }), { numRuns: 50 });
    });

    test('Property 13.2: Transformation within stock limits should be allowed', () => {
        fc.assert(fc.property(validStockRequestArb, async (request) => {
            const result = await validator.validateTransformationRequest(request);
            
            // Should be valid because it doesn't result in negative stock
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        }), { numRuns: 50 });
    });

    test('Property 13.3: Stock availability validation should prevent negative stock', () => {
        fc.assert(fc.property(itemWithVariousStockArb, fc.integer({ min: 1, max: 200 }), (item, quantity) => {
            const result = validator.validateStockAvailability(item, quantity);
            
            if (quantity > item.stok) {
                // Should be invalid when quantity exceeds stock
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            } else {
                // Should be valid when quantity is within stock limits
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            }
        }), { numRuns: 100 });
    });

    test('Property 13.4: Zero stock should prevent any transformation', () => {
        const zeroStockItem = {
            kode: 'ZERO-STOCK',
            nama: 'Zero Stock Item',
            baseProduct: 'TEST',
            satuan: 'pcs',
            stok: 0,
            kategori: 'test'
        };

        fc.assert(fc.property(fc.integer({ min: 1, max: 100 }), (quantity) => {
            const result = validator.validateStockAvailability(zeroStockItem, quantity);
            
            // Should always be invalid for zero stock
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('habis'))).toBe(true);
        }), { numRuns: 50 });
    });

    test('Property 13.5: Business rules validation should check for negative stock scenarios', () => {
        // Create a mock request and items for business rules validation
        const mockRequest = {
            sourceItemId: 'TEST-SOURCE',
            targetItemId: 'TEST-TARGET',
            sourceQuantity: 15, // More than available
            user: 'testuser'
        };

        const mockSourceItem = {
            kode: 'TEST-SOURCE',
            nama: 'Test Source',
            baseProduct: 'TEST',
            satuan: 'dus',
            stok: 10, // Less than requested quantity
            kategori: 'test'
        };

        const mockTargetItem = {
            kode: 'TEST-TARGET',
            nama: 'Test Target',
            baseProduct: 'TEST',
            satuan: 'pcs',
            stok: 50,
            kategori: 'test'
        };

        const ratio = 12;

        // Use the private method through reflection or test the public interface
        const businessRulesResult = validator._validateBusinessRules(mockRequest, mockSourceItem, mockTargetItem, ratio);
        
        // Should detect negative stock scenario
        expect(businessRulesResult.isValid).toBe(false);
        expect(businessRulesResult.errors.length).toBeGreaterThan(0);
        expect(businessRulesResult.errors.some(error => error.includes('negatif'))).toBe(true);
    });

    test('Property 13.6: Edge case - exact stock match should not result in negative stock', () => {
        fc.assert(fc.property(itemWithVariousStockArb.filter(item => item.stok > 0), (item) => {
            // Use exact stock amount
            const result = validator.validateStockAvailability(item, item.stok);
            
            // Should be valid - no negative stock
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            
            // But should warn about emptying stock
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(warning => warning.includes('habis'))).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 13.7: One unit over stock should be prevented', () => {
        fc.assert(fc.property(itemWithVariousStockArb.filter(item => item.stok > 0), (item) => {
            // Use one more than stock
            const result = validator.validateStockAvailability(item, item.stok + 1);
            
            // Should be invalid - would result in negative stock
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('tidak mencukupi'))).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 13.8: Negative stock prevention should work with floating point quantities', () => {
        const itemWithDecimalStock = {
            kode: 'DECIMAL-STOCK',
            nama: 'Decimal Stock Item',
            baseProduct: 'TEST',
            satuan: 'kg',
            stok: 10.5,
            kategori: 'test'
        };

        // Test with quantity that would result in negative stock
        const result1 = validator.validateStockAvailability(itemWithDecimalStock, 11);
        expect(result1.isValid).toBe(false);

        // Test with quantity within limits
        const result2 = validator.validateStockAvailability(itemWithDecimalStock, 10);
        expect(result2.isValid).toBe(true);
    });

    test('Property 13.9: Multiple validation layers should consistently prevent negative stock', () => {
        fc.assert(fc.property(negativeStockRequestArb, async (request) => {
            // Test both stock availability validation and full request validation
            const masterBarang = JSON.parse(localStorage.getItem('masterBarang'));
            const sourceItem = masterBarang.find(item => item.kode === request.sourceItemId);
            
            if (sourceItem) {
                // Direct stock validation
                const stockResult = validator.validateStockAvailability(sourceItem, request.sourceQuantity);
                
                // Full request validation
                const requestResult = await validator.validateTransformationRequest(request);
                
                // Both should be invalid for negative stock scenarios
                expect(stockResult.isValid).toBe(false);
                expect(requestResult.isValid).toBe(false);
                
                // Both should have errors
                expect(stockResult.errors.length).toBeGreaterThan(0);
                expect(requestResult.errors.length).toBeGreaterThan(0);
            }
        }), { numRuns: 50 });
    });

    test('Property 13.10: Validation should handle edge cases gracefully', () => {
        const edgeCaseItems = [
            { stok: 0 },
            { stok: 0.1 },
            { stok: Number.MAX_SAFE_INTEGER },
            { stok: Number.MIN_VALUE },
            { stok: undefined },
            { stok: null }
        ].map(stockOverride => ({
            kode: 'EDGE-CASE',
            nama: 'Edge Case Item',
            baseProduct: 'TEST',
            satuan: 'pcs',
            kategori: 'test',
            ...stockOverride
        }));

        edgeCaseItems.forEach(item => {
            const result = validator.validateStockAvailability(item, 1);
            
            // Should always have a valid result structure
            expect(result).toHaveProperty('isValid');
            expect(result).toHaveProperty('errors');
            expect(result).toHaveProperty('warnings');
            
            // For zero, undefined, or null stock, should be invalid
            if (!item.stok || item.stok <= 0) {
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            }
        });
    });
});