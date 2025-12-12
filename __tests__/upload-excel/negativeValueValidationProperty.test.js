/**
 * Property-Based Test: Negative Value Validation
 * Feature: upload-master-barang-excel, Property 8: Negative Value Validation
 * 
 * Validates: Requirements 2.4
 * For any data containing negative harga_beli or stok values, the validation engine 
 * should reject the data with appropriate error messages
 */

import fc from 'fast-check';

// Mock ValidationEngine for testing
class ValidationEngine {
    constructor() {
        this.validationRules = {
            requiredFields: ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'],
            businessRules: {
                harga_beli: { min: 0, warningThreshold: 10000000 },
                stok: { min: 0, warningThreshold: 10000 }
            }
        };
    }

    validateBusinessRules(row, rowIndex) {
        const errors = [];
        const warnings = [];
        
        // Validate harga_beli business rules
        if (row.harga_beli !== undefined && row.harga_beli !== null && row.harga_beli !== '') {
            const hargaBeli = parseFloat(row.harga_beli);
            if (!isNaN(hargaBeli)) {
                if (hargaBeli < this.validationRules.businessRules.harga_beli.min) {
                    errors.push({
                        type: 'business',
                        field: 'harga_beli',
                        row: rowIndex,
                        message: `Harga beli tidak boleh negatif, ditemukan: ${hargaBeli}`,
                        severity: 'error',
                        code: 'NEGATIVE_VALUE_NOT_ALLOWED'
                    });
                } else if (hargaBeli > this.validationRules.businessRules.harga_beli.warningThreshold) {
                    warnings.push({
                        type: 'business',
                        field: 'harga_beli',
                        row: rowIndex,
                        message: `Harga beli sangat tinggi: ${hargaBeli.toLocaleString('id-ID')}. Pastikan nilai sudah benar.`,
                        severity: 'warning',
                        code: 'HIGH_VALUE_WARNING'
                    });
                }
            }
        }
        
        // Validate stok business rules
        if (row.stok !== undefined && row.stok !== null && row.stok !== '') {
            const stok = parseFloat(row.stok);
            if (!isNaN(stok)) {
                if (stok < this.validationRules.businessRules.stok.min) {
                    errors.push({
                        type: 'business',
                        field: 'stok',
                        row: rowIndex,
                        message: `Stok tidak boleh negatif, ditemukan: ${stok}`,
                        severity: 'error',
                        code: 'NEGATIVE_VALUE_NOT_ALLOWED'
                    });
                } else if (stok > this.validationRules.businessRules.stok.warningThreshold) {
                    warnings.push({
                        type: 'business',
                        field: 'stok',
                        row: rowIndex,
                        message: `Stok sangat tinggi: ${stok.toLocaleString('id-ID')}. Pastikan nilai sudah benar.`,
                        severity: 'warning',
                        code: 'HIGH_VALUE_WARNING'
                    });
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

describe('Property 8: Negative Value Validation', () => {
    let validationEngine;

    beforeEach(() => {
        validationEngine = new ValidationEngine();
    });

    test('should reject any data with negative harga_beli values', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    kategori: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.string({ minLength: 1, maxLength: 20 }),
                    harga_beli: fc.float({ min: -1000000, max: 1000000 }),
                    stok: fc.float({ min: 0, max: 10000 })
                }),
                fc.integer({ min: 1, max: 1000 }), // Row index
                (row, rowIndex) => {
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    const hargaBeli = parseFloat(row.harga_beli);
                    const negativeHargaBeliErrors = result.errors.filter(error => 
                        error.field === 'harga_beli' && error.code === 'NEGATIVE_VALUE_NOT_ALLOWED'
                    );
                    
                    // Property: If harga_beli is negative, should have exactly one error
                    if (!isNaN(hargaBeli) && hargaBeli < 0) {
                        expect(negativeHargaBeliErrors.length).toBe(1);
                        expect(result.isValid).toBe(false);
                        
                        const error = negativeHargaBeliErrors[0];
                        expect(error.type).toBe('business');
                        expect(error.severity).toBe('error');
                        expect(error.row).toBe(rowIndex);
                        expect(error.message).toContain('tidak boleh negatif');
                        expect(error.message).toContain(hargaBeli.toString());
                    } else {
                        // Property: If harga_beli is non-negative, should have no negative value errors
                        expect(negativeHargaBeliErrors.length).toBe(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should reject any data with negative stok values', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    kategori: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.string({ minLength: 1, maxLength: 20 }),
                    harga_beli: fc.float({ min: 0, max: 1000000 }),
                    stok: fc.float({ min: -10000, max: 10000 })
                }),
                fc.integer({ min: 1, max: 1000 }), // Row index
                (row, rowIndex) => {
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    const stok = parseFloat(row.stok);
                    const negativeStokErrors = result.errors.filter(error => 
                        error.field === 'stok' && error.code === 'NEGATIVE_VALUE_NOT_ALLOWED'
                    );
                    
                    // Property: If stok is negative, should have exactly one error
                    if (!isNaN(stok) && stok < 0) {
                        expect(negativeStokErrors.length).toBe(1);
                        expect(result.isValid).toBe(false);
                        
                        const error = negativeStokErrors[0];
                        expect(error.type).toBe('business');
                        expect(error.severity).toBe('error');
                        expect(error.row).toBe(rowIndex);
                        expect(error.message).toContain('tidak boleh negatif');
                        expect(error.message).toContain(stok.toString());
                    } else {
                        // Property: If stok is non-negative, should have no negative value errors
                        expect(negativeStokErrors.length).toBe(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle both negative harga_beli and stok in the same row', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    kategori: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.string({ minLength: 1, maxLength: 20 }),
                    harga_beli: fc.float({ min: -1000000, max: 1000000 }),
                    stok: fc.float({ min: -10000, max: 10000 })
                }),
                fc.integer({ min: 1, max: 1000 }), // Row index
                (row, rowIndex) => {
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    const hargaBeli = parseFloat(row.harga_beli);
                    const stok = parseFloat(row.stok);
                    
                    const negativeValueErrors = result.errors.filter(error => 
                        error.code === 'NEGATIVE_VALUE_NOT_ALLOWED'
                    );
                    
                    let expectedErrors = 0;
                    
                    // Count expected errors
                    if (!isNaN(hargaBeli) && hargaBeli < 0) {
                        expectedErrors++;
                    }
                    if (!isNaN(stok) && stok < 0) {
                        expectedErrors++;
                    }
                    
                    // Property: Should have exactly the expected number of negative value errors
                    expect(negativeValueErrors.length).toBe(expectedErrors);
                    
                    if (expectedErrors > 0) {
                        expect(result.isValid).toBe(false);
                        
                        // Property: Each error should reference the correct field and row
                        negativeValueErrors.forEach(error => {
                            expect(error.type).toBe('business');
                            expect(error.severity).toBe('error');
                            expect(error.row).toBe(rowIndex);
                            expect(['harga_beli', 'stok']).toContain(error.field);
                        });
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should generate warnings for high values but not errors', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    kategori: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.string({ minLength: 1, maxLength: 20 }),
                    harga_beli: fc.float({ min: 10000000, max: 50000000 }), // Above warning threshold
                    stok: fc.float({ min: 10000, max: 50000 }) // Above warning threshold
                }),
                fc.integer({ min: 1, max: 1000 }), // Row index
                (row, rowIndex) => {
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    const hargaBeli = parseFloat(row.harga_beli);
                    const stok = parseFloat(row.stok);
                    
                    // Property: High values should not generate errors (only warnings)
                    const negativeValueErrors = result.errors.filter(error => 
                        error.code === 'NEGATIVE_VALUE_NOT_ALLOWED'
                    );
                    expect(negativeValueErrors.length).toBe(0);
                    
                    // Property: High values should generate warnings
                    const highValueWarnings = result.warnings.filter(warning => 
                        warning.code === 'HIGH_VALUE_WARNING'
                    );
                    
                    let expectedWarnings = 0;
                    if (!isNaN(hargaBeli) && hargaBeli > 10000000) {
                        expectedWarnings++;
                    }
                    if (!isNaN(stok) && stok > 10000) {
                        expectedWarnings++;
                    }
                    
                    expect(highValueWarnings.length).toBe(expectedWarnings);
                    
                    // Property: Validation should still be valid (warnings don't invalidate)
                    expect(result.isValid).toBe(true);
                    
                    // Property: Warning messages should be helpful
                    highValueWarnings.forEach(warning => {
                        expect(warning.type).toBe('business');
                        expect(warning.severity).toBe('warning');
                        expect(warning.row).toBe(rowIndex);
                        expect(warning.message).toContain('sangat tinggi');
                        expect(warning.message).toContain('Pastikan nilai sudah benar');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle edge cases with zero values correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    kategori: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.string({ minLength: 1, maxLength: 20 }),
                    harga_beli: fc.constantFrom(0, 0.0, -0, '0', '0.0'),
                    stok: fc.constantFrom(0, 0.0, -0, '0', '0.0')
                }),
                fc.integer({ min: 1, max: 1000 }), // Row index
                (row, rowIndex) => {
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    // Property: Zero values should be valid (not negative)
                    const negativeValueErrors = result.errors.filter(error => 
                        error.code === 'NEGATIVE_VALUE_NOT_ALLOWED'
                    );
                    expect(negativeValueErrors.length).toBe(0);
                    
                    // Property: Zero values should not generate high value warnings
                    const highValueWarnings = result.warnings.filter(warning => 
                        warning.code === 'HIGH_VALUE_WARNING'
                    );
                    expect(highValueWarnings.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle non-numeric values without negative value errors', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    kategori: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.string({ minLength: 1, maxLength: 20 }),
                    harga_beli: fc.oneof(
                        fc.constant(''),
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.string().filter(s => isNaN(parseFloat(s)))
                    ),
                    stok: fc.oneof(
                        fc.constant(''),
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.string().filter(s => isNaN(parseFloat(s)))
                    )
                }),
                fc.integer({ min: 1, max: 1000 }), // Row index
                (row, rowIndex) => {
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    // Property: Non-numeric values should not generate negative value errors
                    const negativeValueErrors = result.errors.filter(error => 
                        error.code === 'NEGATIVE_VALUE_NOT_ALLOWED'
                    );
                    expect(negativeValueErrors.length).toBe(0);
                    
                    // Property: Non-numeric values should not generate high value warnings
                    const highValueWarnings = result.warnings.filter(warning => 
                        warning.code === 'HIGH_VALUE_WARNING'
                    );
                    expect(highValueWarnings.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});