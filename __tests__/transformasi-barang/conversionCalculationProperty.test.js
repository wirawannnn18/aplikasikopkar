/**
 * Property-based tests untuk Conversion Calculation - Transformasi Barang
 * 
 * Property 2: Conversion Calculation Accuracy
 * Validates: Requirements 1.2
 */

import fc from 'fast-check';

// Import ConversionCalculator
let ConversionCalculator;

// Setup untuk browser environment
if (typeof window !== 'undefined') {
    ConversionCalculator = window.ConversionCalculator;
} else {
    // Node.js environment - load dari file
    const path = require('path');
    const fs = require('fs');
    
    // Load dan evaluate file JavaScript
    const calculatorPath = path.join(__dirname, '../../js/transformasi-barang/ConversionCalculator.js');
    const calculatorCode = fs.readFileSync(calculatorPath, 'utf8');
    
    // Create a mock environment
    const mockWindow = {};
    const mockLocalStorage = {
        data: {},
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; },
        removeItem: function(key) { delete this.data[key]; }
    };
    
    // Mock localStorage untuk testing
    global.localStorage = mockLocalStorage;
    
    eval(calculatorCode.replace('window.', 'mockWindow.'));
    ConversionCalculator = mockWindow.ConversionCalculator;
}

describe('Feature: transformasi-barang, Property 2: Conversion Calculation Accuracy', () => {
    
    let calculator;
    
    beforeEach(() => {
        calculator = new ConversionCalculator();
        calculator.initialize();
        
        // Setup sample conversion ratios untuk testing
        const sampleRatios = [
            {
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 },
                    { from: 'pcs', to: 'dus', ratio: 1/12 }
                ]
            },
            {
                baseProduct: 'INDOMIE',
                conversions: [
                    { from: 'karton', to: 'pcs', ratio: 40 },
                    { from: 'pcs', to: 'karton', ratio: 1/40 }
                ]
            }
        ];
        
        calculator.saveConversionRatios(sampleRatios);
    });

    // Generator untuk source quantity yang valid
    const validSourceQuantityArb = fc.float({ min: 0, max: 1000 });
    
    // Generator untuk conversion ratio yang valid
    const validConversionRatioArb = fc.float({ min: Math.fround(0.001), max: Math.fround(1000) });

    test('Property 2.1: Target quantity should equal source quantity multiplied by conversion ratio', () => {
        fc.assert(fc.property(validSourceQuantityArb, validConversionRatioArb, (sourceQty, ratio) => {
            const targetQty = calculator.calculateTargetQuantity(sourceQty, ratio);
            const expectedQty = sourceQty * ratio;
            
            // Allow for small floating point precision differences
            const tolerance = 0.000001;
            const difference = Math.abs(targetQty - expectedQty);
            
            expect(difference).toBeLessThan(tolerance);
        }), { numRuns: 100 });
    });

    test('Property 2.2: Calculation should be commutative for inverse ratios', () => {
        fc.assert(fc.property(validSourceQuantityArb.filter(q => q > 0), (sourceQty) => {
            const ratio = 12; // 1 dus = 12 pcs
            const inverseRatio = 1/12; // 1 pcs = 1/12 dus
            
            // Convert dus to pcs, then back to dus
            const pcsQty = calculator.calculateTargetQuantity(sourceQty, ratio);
            const backToDusQty = calculator.calculateTargetQuantity(pcsQty, inverseRatio);
            
            // Should get back to original quantity (within tolerance)
            const tolerance = 0.000001;
            const difference = Math.abs(backToDusQty - sourceQty);
            
            expect(difference).toBeLessThan(tolerance);
        }), { numRuns: 100 });
    });

    test('Property 2.3: Zero source quantity should result in zero target quantity', () => {
        fc.assert(fc.property(validConversionRatioArb, (ratio) => {
            const targetQty = calculator.calculateTargetQuantity(0, ratio);
            expect(targetQty).toBe(0);
        }), { numRuns: 100 });
    });

    test('Property 2.4: Conversion with ratio 1 should preserve quantity', () => {
        fc.assert(fc.property(validSourceQuantityArb, (sourceQty) => {
            const targetQty = calculator.calculateTargetQuantity(sourceQty, 1);
            
            // Should be exactly equal for ratio 1
            const tolerance = 0.000001;
            const difference = Math.abs(targetQty - sourceQty);
            
            expect(difference).toBeLessThan(tolerance);
        }), { numRuns: 100 });
    });

    test('Property 2.5: Invalid input should throw appropriate errors', () => {
        const invalidSourceQuantities = fc.oneof(
            fc.constant(-1),
            fc.constant(-100),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('invalid')
        );
        
        const invalidRatios = fc.oneof(
            fc.constant(0),
            fc.constant(-1),
            fc.constant(-100),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('invalid')
        );

        fc.assert(fc.property(invalidSourceQuantities, validConversionRatioArb, (invalidQty, validRatio) => {
            expect(() => {
                calculator.calculateTargetQuantity(invalidQty, validRatio);
            }).toThrow();
        }), { numRuns: 50 });

        fc.assert(fc.property(validSourceQuantityArb, invalidRatios, (validQty, invalidRatio) => {
            expect(() => {
                calculator.calculateTargetQuantity(validQty, invalidRatio);
            }).toThrow();
        }), { numRuns: 50 });
    });

    test('Property 2.6: Reverse calculation should be accurate', () => {
        fc.assert(fc.property(validSourceQuantityArb.filter(q => q > 0), validConversionRatioArb, (targetQty, ratio) => {
            const calculatedSourceQty = calculator.calculateSourceQuantity(targetQty, ratio);
            const expectedSourceQty = targetQty / ratio;
            
            // Allow for small floating point precision differences
            const tolerance = 0.000001;
            const difference = Math.abs(calculatedSourceQty - expectedSourceQty);
            
            expect(difference).toBeLessThan(tolerance);
        }), { numRuns: 100 });
    });

    test('Property 2.7: Getting conversion ratio should return correct values', () => {
        // Test dengan data yang sudah disetup
        const ratio1 = calculator.getConversionRatio('dus', 'pcs', 'AQUA-1L');
        expect(ratio1).toBe(12);
        
        const ratio2 = calculator.getConversionRatio('pcs', 'dus', 'AQUA-1L');
        expect(ratio2).toBe(1/12);
        
        const ratio3 = calculator.getConversionRatio('karton', 'pcs', 'INDOMIE');
        expect(ratio3).toBe(40);
    });

    test('Property 2.8: Getting non-existent conversion ratio should throw error', () => {
        expect(() => {
            calculator.getConversionRatio('dus', 'pcs', 'NON_EXISTENT');
        }).toThrow();
        
        expect(() => {
            calculator.getConversionRatio('invalid_unit', 'pcs', 'AQUA-1L');
        }).toThrow();
    });
});