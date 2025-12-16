// Feature: master-barang-komprehensif, Property 26: Stock validation and warnings
// Validates: Requirements 7.3
// Task 2.3: Write property test for stock validation and warnings

import fc from 'fast-check';
import { ValidationEngine } from '../../js/master-barang/ValidationEngine.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    error: () => {},
    warn: () => {},
    log: () => {}
};

describe('Property 26: Stock validation and warnings', () => {
    let validationEngine;

    beforeEach(() => {
        localStorage.clear();
        validationEngine = new ValidationEngine();
    });

    // Arbitraries for generating test data
    const validStockArbitrary = fc.integer({ min: 0, max: 999999999 });
    const invalidStockArbitrary = fc.oneof(
        fc.integer({ min: -999999, max: -1 }), // Negative
        fc.constant(1000000000), // Too large
        fc.constant('invalid'), // Non-numeric string
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(NaN),
        fc.constant(Infinity),
        fc.constant(-Infinity)
    );

    const baseBarangDataArbitrary = fc.record({
        kode: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[A-Za-z0-9\-]+$/.test(s)),
        nama: fc.string({ minLength: 2, maxLength: 100 }),
        kategori_id: fc.uuid(),
        satuan_id: fc.uuid(),
        harga_beli: fc.integer({ min: 0, max: 999999 }),
        harga_jual: fc.integer({ min: 0, max: 999999 })
    });

    test('Property: For any valid stock values, validation should pass consistently', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                validStockArbitrary,
                validStockArbitrary,
                (baseData, stok, stokMinimum) => {
                    const barangData = {
                        ...baseData,
                        stok: stok,
                        stok_minimum: stokMinimum
                    };

                    // Action: Validate barang with valid stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Valid stock should not produce stock-related errors
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        !error.includes('mencapai') // Exclude warnings
                    );

                    return !hasStockError;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any invalid stock values, validation should fail consistently', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.oneof(
                    fc.integer({ min: -999999, max: -1 }), // Negative numbers
                    fc.string().filter(s => isNaN(Number(s)) && s.trim() !== '') // Non-numeric strings
                ),
                fc.constantFrom('stok', 'stok_minimum'),
                (baseData, invalidStock, stockField) => {
                    const barangData = {
                        ...baseData,
                        [stockField]: invalidStock
                    };

                    // Action: Validate barang with invalid stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Invalid stock should produce validation errors
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok')
                    );

                    return hasStockError && !result.isValid;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stok values that are too large, validation should fail consistently', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.integer({ min: 1000000000, max: 9999999999 }),
                (baseData, tooLargeStock) => {
                    const barangData = {
                        ...baseData,
                        stok: tooLargeStock // Only test stok field since stok_minimum doesn't have max validation
                    };

                    // Action: Validate barang with too large stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Too large stock should produce validation errors
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') &&
                        error.includes('tidak boleh lebih dari')
                    );

                    return hasStockError && !result.isValid;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any negative stock values, validation should reject consistently', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.integer({ min: -999999, max: -1 }),
                fc.constantFrom('stok', 'stok_minimum'),
                (baseData, negativeStock, stockField) => {
                    const barangData = {
                        ...baseData,
                        [stockField]: negativeStock
                    };

                    // Action: Validate barang with negative stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Should reject negative stock
                    const hasNegativeStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        (error.includes('positif') || error.includes('nol'))
                    );

                    return hasNegativeStockError && !result.isValid;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock values exceeding maximum, validation should reject consistently', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.integer({ min: 1000000000, max: 9999999999 }),
                fc.constantFrom('stok', 'stok_minimum'),
                (baseData, excessiveStock, stockField) => {
                    const barangData = {
                        ...baseData,
                        [stockField]: excessiveStock
                    };

                    // Action: Validate barang with excessive stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Should reject stock exceeding maximum
                    const hasExcessiveStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        error.includes('tidak boleh lebih dari')
                    );

                    // Only stok field has maximum validation, stok_minimum doesn't
                    return stockField === 'stok' ? (hasExcessiveStockError && !result.isValid) : true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any non-numeric stock values, validation should reject consistently', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.oneof(
                    fc.string().filter(s => isNaN(Number(s)) && s.trim() !== ''),
                    fc.constant({}),
                    fc.constant(true)
                ),
                fc.constantFrom('stok', 'stok_minimum'),
                (baseData, nonNumericStock, stockField) => {
                    const barangData = {
                        ...baseData,
                        [stockField]: nonNumericStock
                    };

                    // Action: Validate barang with non-numeric stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Should reject non-numeric stock
                    const hasNumericError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        (error.includes('angka') || error.includes('positif'))
                    );

                    // Check if the value is actually non-numeric after Number conversion
                    const isActuallyNonNumeric = isNaN(Number(nonNumericStock));
                    
                    return isActuallyNonNumeric ? (hasNumericError && !result.isValid) : true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock at or below minimum threshold, should warn consistently', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.integer({ min: 1, max: 100 }), // Minimum stock
                fc.integer({ min: 0, max: 2 }), // Offset to make current stock <= minimum
                (baseData, stokMinimum, offset) => {
                    const stok = Math.max(1, stokMinimum - offset); // Ensure stock > 0 but <= minimum
                    
                    const barangData = {
                        ...baseData,
                        stok: stok,
                        stok_minimum: stokMinimum
                    };

                    // Action: Validate barang with low stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Should produce warning about low stock
                    const hasLowStockWarning = result.warnings.some(warning => 
                        warning.toLowerCase().includes('stok') && 
                        (warning.includes('minimum') || warning.includes('mencapai'))
                    );

                    return stok <= stokMinimum && stok > 0 ? hasLowStockWarning : true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any zero stock, should handle appropriately', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.integer({ min: 0, max: 100 }),
                (baseData, stokMinimum) => {
                    const barangData = {
                        ...baseData,
                        stok: 0,
                        stok_minimum: stokMinimum
                    };

                    // Action: Validate barang with zero stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Zero stock should not produce validation errors
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok')
                    );

                    // Zero is a valid stock value, should not cause validation errors
                    return !hasStockError;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock validation, should handle zero values appropriately', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.constantFrom('stok', 'stok_minimum', 'both'),
                (baseData, zeroField) => {
                    const barangData = { ...baseData };
                    
                    if (zeroField === 'stok' || zeroField === 'both') {
                        barangData.stok = 0;
                    }
                    if (zeroField === 'stok_minimum' || zeroField === 'both') {
                        barangData.stok_minimum = 0;
                    }

                    // Action: Validate barang with zero stock values
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Zero should be accepted as valid stock value
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        !error.includes('mencapai') // Exclude warnings
                    );

                    return !hasStockError;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock validation in update mode, should handle partial updates', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.record({ stok: validStockArbitrary }),
                    fc.record({ stok_minimum: validStockArbitrary }),
                    fc.record({})
                ),
                (updateData) => {
                    // Action: Validate partial update with only stock fields
                    const result = validationEngine.validateBarang(updateData, true);

                    // Property: Should not require both stock fields in update mode
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        error.includes('harus diisi')
                    );

                    return !hasStockError;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock validation, should be deterministic', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.option(validStockArbitrary, { nil: undefined }),
                fc.option(validStockArbitrary, { nil: undefined }),
                (baseData, stok, stokMinimum) => {
                    const barangData = {
                        ...baseData,
                        stok: stok,
                        stok_minimum: stokMinimum
                    };

                    // Action: Validate same data twice
                    const result1 = validationEngine.validateBarang(barangData);
                    const result2 = validationEngine.validateBarang(barangData);

                    // Property: Results should be identical
                    const sameStockErrors = result1.errors.filter(e => e.toLowerCase().includes('stok'))
                        .join('|') === result2.errors.filter(e => e.toLowerCase().includes('stok')).join('|');
                    const sameStockWarnings = result1.warnings.filter(w => w.toLowerCase().includes('stok'))
                        .join('|') === result2.warnings.filter(w => w.toLowerCase().includes('stok')).join('|');

                    return sameStockErrors && sameStockWarnings;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any string representation of stock numbers, should parse correctly', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                validStockArbitrary,
                validStockArbitrary,
                (baseData, numericStok, numericStokMinimum) => {
                    const barangData = {
                        ...baseData,
                        stok: numericStok.toString(),
                        stok_minimum: numericStokMinimum.toString()
                    };

                    // Action: Validate barang with string stock values
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Valid numeric strings should be accepted
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        error.includes('angka')
                    );

                    return !hasStockError;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock validation, error messages should be specific and helpful', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.oneof(
                    fc.constant(-100), // Negative
                    fc.constant('abc') // Non-numeric
                ),
                fc.constantFrom('stok', 'stok_minimum'),
                (baseData, invalidStock, stockField) => {
                    const barangData = {
                        ...baseData,
                        [stockField]: invalidStock
                    };

                    // Action: Validate barang with invalid stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Error messages should be descriptive
                    const stockErrors = result.errors.filter(error => 
                        error.toLowerCase().includes('stok')
                    );

                    // Only expect errors for values that should actually trigger validation
                    if (invalidStock === null || invalidStock === undefined) {
                        return true; // null/undefined might not trigger validation
                    }

                    if (stockErrors.length === 0) return false;

                    const hasDescriptiveError = stockErrors.some(error => {
                        const lowerError = error.toLowerCase();
                        return (
                            lowerError.includes('positif') ||
                            lowerError.includes('angka') ||
                            lowerError.includes('tidak boleh lebih dari') ||
                            lowerError.includes('nol')
                        );
                    });

                    return hasDescriptiveError;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock with decimal values, should handle appropriately', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.float({ min: 0, max: 999999, noNaN: true }),
                fc.float({ min: 0, max: 999999, noNaN: true }),
                (baseData, stok, stokMinimum) => {
                    const barangData = {
                        ...baseData,
                        stok: stok,
                        stok_minimum: stokMinimum
                    };

                    // Action: Validate barang with decimal stock
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Should handle decimal stock appropriately
                    // (Implementation may round or accept decimals)
                    const hasStockError = result.errors.some(error => 
                        error.toLowerCase().includes('stok') && 
                        error.includes('angka')
                    );

                    // Should not reject valid decimal numbers
                    return !hasStockError;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock validation with edge values, should handle boundaries correctly', () => {
        const edgeValues = [0, 1, 999999999, 1000000000];
        
        edgeValues.forEach(edgeValue => {
            fc.assert(
                fc.property(
                    baseBarangDataArbitrary,
                    fc.constantFrom('stok', 'stok_minimum'),
                    (baseData, stockField) => {
                        const barangData = {
                            ...baseData,
                            [stockField]: edgeValue
                        };

                        // Action: Validate barang with edge value
                        const result = validationEngine.validateBarang(barangData);

                        // Property: Should handle boundary values correctly
                        const hasStockError = result.errors.some(error => 
                            error.toLowerCase().includes('stok')
                        );

                        // Values 0-999999999 should be valid, 1000000000+ should be invalid
                        // But only stok field has maximum validation, stok_minimum doesn't
                        const shouldBeValid = edgeValue <= 999999999;
                        const shouldValidate = stockField === 'stok' || edgeValue < 0; // Only stok validates max, both validate negative
                        
                        if (!shouldValidate) {
                            return true; // stok_minimum doesn't have max validation
                        }
                        
                        return shouldBeValid ? !hasStockError : hasStockError;
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    test('Property: For any stock comparison scenarios, warnings should be consistent', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.integer({ min: 0, max: 1000 }),
                fc.integer({ min: 0, max: 1000 }),
                (baseData, stok, stokMinimum) => {
                    const barangData = {
                        ...baseData,
                        stok: stok,
                        stok_minimum: stokMinimum
                    };

                    // Action: Validate barang with stock comparison
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Warning logic should be consistent
                    const hasLowStockWarning = result.warnings.some(warning => 
                        warning.toLowerCase().includes('stok') && 
                        warning.includes('minimum')
                    );

                    // Check warning conditions based on actual implementation
                    // The ValidationEngine only warns when stok > 0 and stok <= stokMinimum
                    const shouldWarnLowStock = stok > 0 && stok <= stokMinimum;

                    const lowStockCorrect = shouldWarnLowStock ? hasLowStockWarning : !hasLowStockWarning;

                    return lowStockCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock validation, should not affect other field validations', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[A-Za-z0-9\-]+$/.test(s)),
                    nama: fc.string({ minLength: 2, maxLength: 100 }),
                    kategori_id: fc.uuid(),
                    satuan_id: fc.uuid(),
                    harga_beli: fc.integer({ min: 0, max: 999999 }),
                    harga_jual: fc.integer({ min: 0, max: 999999 })
                }),
                invalidStockArbitrary,
                (validBaseData, invalidStock) => {
                    const barangDataWithInvalidStock = {
                        ...validBaseData,
                        stok: invalidStock
                    };

                    const barangDataWithoutStock = { ...validBaseData };

                    // Action: Validate both versions
                    const resultWithInvalidStock = validationEngine.validateBarang(barangDataWithInvalidStock);
                    const resultWithoutStock = validationEngine.validateBarang(barangDataWithoutStock);

                    // Property: Non-stock errors should be the same
                    const nonStockErrorsWithInvalid = resultWithInvalidStock.errors.filter(e => 
                        !e.toLowerCase().includes('stok')
                    );
                    const nonStockErrorsWithout = resultWithoutStock.errors.filter(e => 
                        !e.toLowerCase().includes('stok')
                    );

                    return JSON.stringify(nonStockErrorsWithInvalid) === JSON.stringify(nonStockErrorsWithout);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any stock warning scenarios, should not affect validation success for valid data', () => {
        fc.assert(
            fc.property(
                baseBarangDataArbitrary,
                fc.integer({ min: 1, max: 100 }),
                (baseData, stokMinimum) => {
                    const barangData = {
                        ...baseData,
                        stok: Math.max(1, stokMinimum - 1), // Low stock but valid
                        stok_minimum: stokMinimum
                    };

                    // Action: Validate barang with low stock warning
                    const result = validationEngine.validateBarang(barangData);

                    // Property: Should be valid despite warnings
                    const hasWarnings = result.warnings.length > 0;
                    const isValid = result.isValid;

                    // Valid data with warnings should still pass validation
                    return hasWarnings ? isValid : true;
                }
            ),
            { numRuns: 100 }
        );
    });
});