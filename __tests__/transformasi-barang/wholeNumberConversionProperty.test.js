/**
 * Property-based tests untuk Whole Number Conversion - Transformasi Barang
 * 
 * Property 12: Whole Number Conversion
 * Validates: Requirements 3.2
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

describe('Feature: transformasi-barang, Property 12: Whole Number Conversion', () => {
    
    let calculator;
    
    beforeEach(() => {
        calculator = new ConversionCalculator();
        calculator.initialize();
    });

    // Generator untuk bilangan bulat
    const wholeNumberArb = fc.integer({ min: 0, max: 1000 });
    
    // Generator untuk bilangan desimal dengan presisi tinggi
    const decimalNumberArb = fc.float({ min: Math.fround(0.1), max: Math.fround(1000.9) });
    
    // Generator untuk bilangan yang sangat dekat dengan bilangan bulat
    const nearWholeNumberArb = fc.integer({ min: 1, max: 1000 }).map(n => 
        fc.oneof(
            fc.constant(n + 0.0000001), // Sangat dekat di atas
            fc.constant(n - 0.0000001), // Sangat dekat di bawah
            fc.constant(n)              // Tepat bilangan bulat
        )
    ).chain(x => x);

    test('Property 12.1: Whole numbers should be validated as whole numbers', () => {
        fc.assert(fc.property(wholeNumberArb, (wholeNum) => {
            const isWhole = calculator.validateWholeNumberResult(wholeNum);
            expect(isWhole).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 12.2: Non-whole numbers should be validated as non-whole numbers', () => {
        fc.assert(fc.property(decimalNumberArb.filter(n => Math.abs(n - Math.round(n)) > 0.001), (decimalNum) => {
            const isWhole = calculator.validateWholeNumberResult(decimalNum);
            expect(isWhole).toBe(false);
        }), { numRuns: 100 });
    });

    test('Property 12.3: Numbers very close to whole numbers should be treated as whole numbers', () => {
        fc.assert(fc.property(nearWholeNumberArb, (nearWholeNum) => {
            const isWhole = calculator.validateWholeNumberResult(nearWholeNum);
            
            // Numbers within tolerance should be considered whole
            const tolerance = 0.000001;
            const rounded = Math.round(nearWholeNum);
            const difference = Math.abs(nearWholeNum - rounded);
            
            if (difference < tolerance) {
                expect(isWhole).toBe(true);
            } else {
                expect(isWhole).toBe(false);
            }
        }), { numRuns: 100 });
    });

    test('Property 12.4: Conversion calculations that result in whole numbers should be valid', () => {
        // Test dengan rasio yang menghasilkan bilangan bulat
        const wholeResultRatios = [
            { sourceQty: 1, ratio: 12 },    // 1 * 12 = 12
            { sourceQty: 2, ratio: 6 },     // 2 * 6 = 12
            { sourceQty: 3, ratio: 4 },     // 3 * 4 = 12
            { sourceQty: 12, ratio: 1 },    // 12 * 1 = 12
            { sourceQty: 6, ratio: 2 }      // 6 * 2 = 12
        ];

        wholeResultRatios.forEach(({ sourceQty, ratio }) => {
            const targetQty = calculator.calculateTargetQuantity(sourceQty, ratio);
            const isWhole = calculator.validateWholeNumberResult(targetQty);
            expect(isWhole).toBe(true);
        });
    });

    test('Property 12.5: Conversion calculations that result in non-whole numbers should be invalid', () => {
        // Test dengan rasio yang menghasilkan bilangan desimal
        const nonWholeResultRatios = [
            { sourceQty: 1, ratio: 12.5 },    // 1 * 12.5 = 12.5
            { sourceQty: 3, ratio: 4.33 },    // 3 * 4.33 = 12.99
            { sourceQty: 7, ratio: 1.7 },     // 7 * 1.7 = 11.9
            { sourceQty: 5, ratio: 2.3 }      // 5 * 2.3 = 11.5
        ];

        nonWholeResultRatios.forEach(({ sourceQty, ratio }) => {
            const targetQty = calculator.calculateTargetQuantity(sourceQty, ratio);
            const isWhole = calculator.validateWholeNumberResult(targetQty);
            expect(isWhole).toBe(false);
        });
    });

    test('Property 12.6: Validation should handle edge cases correctly', () => {
        // Test edge cases
        expect(calculator.validateWholeNumberResult(0)).toBe(true);
        expect(calculator.validateWholeNumberResult(0.0)).toBe(true);
        expect(calculator.validateWholeNumberResult(1.0)).toBe(true);
        expect(calculator.validateWholeNumberResult(1.000000001)).toBe(true); // Within tolerance
        expect(calculator.validateWholeNumberResult(1.001)).toBe(false); // Outside tolerance
        
        // Test dengan bilangan besar
        expect(calculator.validateWholeNumberResult(1000000)).toBe(true);
        expect(calculator.validateWholeNumberResult(1000000.0000001)).toBe(true); // Within tolerance
        expect(calculator.validateWholeNumberResult(1000000.1)).toBe(false); // Outside tolerance
    });

    test('Property 12.7: Invalid input should throw appropriate errors', () => {
        const invalidInputs = [null, undefined, 'string', {}, [], NaN, Infinity, -Infinity];
        
        invalidInputs.forEach(invalidInput => {
            expect(() => {
                calculator.validateWholeNumberResult(invalidInput);
            }).toThrow();
        });
    });

    test('Property 12.8: Floating point precision should be handled correctly', () => {
        // Test kasus yang dikenal bermasalah dengan floating point
        const problematicCases = [
            0.1 + 0.2,  // Hasil: 0.30000000000000004
            0.3 * 3,    // Hasil: 0.8999999999999999
            1.0 / 3 * 3, // Hasil: 0.9999999999999999
            Math.sqrt(4), // Hasil: 2 (should be whole)
            Math.pow(2, 3) // Hasil: 8 (should be whole)
        ];

        problematicCases.forEach(value => {
            const isWhole = calculator.validateWholeNumberResult(value);
            
            // Check if the value is actually close to a whole number
            const rounded = Math.round(value);
            const difference = Math.abs(value - rounded);
            const tolerance = 0.000001;
            
            if (difference < tolerance) {
                expect(isWhole).toBe(true);
            } else {
                expect(isWhole).toBe(false);
            }
        });
    });

    test('Property 12.9: Negative numbers should be handled correctly', () => {
        fc.assert(fc.property(fc.integer({ min: -1000, max: -1 }), (negativeInt) => {
            const isWhole = calculator.validateWholeNumberResult(negativeInt);
            expect(isWhole).toBe(true);
        }), { numRuns: 50 });

        fc.assert(fc.property(fc.float({ min: -1000.9, max: -0.1 }).filter(n => Math.abs(n - Math.round(n)) > 0.001), (negativeDecimal) => {
            const isWhole = calculator.validateWholeNumberResult(negativeDecimal);
            expect(isWhole).toBe(false);
        }), { numRuns: 50 });
    });
});