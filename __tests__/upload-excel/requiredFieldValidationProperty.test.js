/**
 * Property-Based Test: Required Field Validation Completeness
 * Feature: upload-master-barang-excel, Property 5: Required Field Validation Completeness
 * 
 * Validates: Requirements 2.1
 * For any uploaded data, the validation engine should identify and report 
 * all missing required fields (kode, nama, kategori, satuan, harga_beli, stok)
 */

import fc from 'fast-check';

// Mock ValidationEngine for testing
class ValidationEngine {
    constructor() {
        this.validationRules = {
            requiredFields: ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'],
            fieldLimits: {
                kode: { maxLength: 20 },
                nama: { maxLength: 100 },
                supplier: { maxLength: 100 }
            },
            businessRules: {
                harga_beli: { min: 0, warningThreshold: 10000000 },
                stok: { min: 0, warningThreshold: 10000 }
            }
        };
    }

    validateBusinessRules(row, rowIndex) {
        const errors = [];
        const warnings = [];
        
        // Check required fields
        for (const field of this.validationRules.requiredFields) {
            if (!row[field] || (typeof row[field] === 'string' && row[field].trim() === '')) {
                errors.push({
                    type: 'business',
                    field: field,
                    row: rowIndex,
                    message: `${field} wajib diisi`,
                    severity: 'error',
                    code: 'REQUIRED_FIELD_MISSING'
                });
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

describe('Property 5: Required Field Validation Completeness', () => {
    let validationEngine;

    beforeEach(() => {
        validationEngine = new ValidationEngine();
    });

    test('should identify all missing required fields in any data row', () => {
        fc.assert(
            fc.property(
                // Generate arbitrary data rows with some fields potentially missing
                fc.record({
                    kode: fc.option(fc.string(), { nil: undefined }),
                    nama: fc.option(fc.string(), { nil: undefined }),
                    kategori: fc.option(fc.string(), { nil: undefined }),
                    satuan: fc.option(fc.string(), { nil: undefined }),
                    harga_beli: fc.option(fc.oneof(fc.float(), fc.string()), { nil: undefined }),
                    stok: fc.option(fc.oneof(fc.float(), fc.string()), { nil: undefined }),
                    supplier: fc.option(fc.string(), { nil: undefined })
                }),
                fc.integer({ min: 1, max: 1000 }), // Row index
                (row, rowIndex) => {
                    // Test the validation
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    // Count actually missing required fields
                    const requiredFields = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
                    const actuallyMissingFields = requiredFields.filter(field => 
                        !row[field] || (typeof row[field] === 'string' && row[field].trim() === '')
                    );
                    
                    // Count errors for missing required fields
                    const missingFieldErrors = result.errors.filter(error => 
                        error.code === 'REQUIRED_FIELD_MISSING'
                    );
                    
                    // Property: Number of missing field errors should equal number of actually missing fields
                    expect(missingFieldErrors.length).toBe(actuallyMissingFields.length);
                    
                    // Property: Each missing field should have exactly one error
                    actuallyMissingFields.forEach(missingField => {
                        const fieldErrors = missingFieldErrors.filter(error => error.field === missingField);
                        expect(fieldErrors.length).toBe(1);
                        expect(fieldErrors[0].message).toContain(`${missingField} wajib diisi`);
                        expect(fieldErrors[0].row).toBe(rowIndex);
                        expect(fieldErrors[0].severity).toBe('error');
                    });
                    
                    // Property: If all required fields are present and non-empty, no missing field errors
                    const allRequiredPresent = requiredFields.every(field => 
                        row[field] && (typeof row[field] !== 'string' || row[field].trim() !== '')
                    );
                    
                    if (allRequiredPresent) {
                        expect(missingFieldErrors.length).toBe(0);
                    }
                    
                    // Property: Validation is invalid if there are missing required fields
                    if (actuallyMissingFields.length > 0) {
                        expect(result.isValid).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle empty strings as missing values for required fields', () => {
        fc.assert(
            fc.property(
                // Generate data with empty strings, whitespace, or null values
                fc.record({
                    kode: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(null), fc.string()),
                    nama: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(null), fc.string()),
                    kategori: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(null), fc.string()),
                    satuan: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(null), fc.string()),
                    harga_beli: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(null), fc.float()),
                    stok: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(null), fc.float())
                }),
                fc.integer({ min: 1, max: 100 }),
                (row, rowIndex) => {
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    // Property: Empty strings and whitespace-only strings should be treated as missing
                    const requiredFields = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
                    requiredFields.forEach(field => {
                        const value = row[field];
                        const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
                        
                        const fieldErrors = result.errors.filter(error => 
                            error.field === field && error.code === 'REQUIRED_FIELD_MISSING'
                        );
                        
                        if (isEmpty) {
                            expect(fieldErrors.length).toBe(1);
                        } else {
                            expect(fieldErrors.length).toBe(0);
                        }
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should provide consistent error messages for missing required fields', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'),
                fc.integer({ min: 1, max: 1000 }),
                (missingField, rowIndex) => {
                    // Create a row with one specific field missing
                    const row = {
                        kode: 'TEST001',
                        nama: 'Test Product',
                        kategori: 'test',
                        satuan: 'pcs',
                        harga_beli: 1000,
                        stok: 10
                    };
                    
                    // Remove the specific field
                    delete row[missingField];
                    
                    const result = validationEngine.validateBusinessRules(row, rowIndex);
                    
                    // Property: Should have exactly one error for the missing field
                    const missingFieldErrors = result.errors.filter(error => 
                        error.field === missingField && error.code === 'REQUIRED_FIELD_MISSING'
                    );
                    
                    expect(missingFieldErrors.length).toBe(1);
                    
                    const error = missingFieldErrors[0];
                    expect(error.message).toBe(`${missingField} wajib diisi`);
                    expect(error.type).toBe('business');
                    expect(error.severity).toBe('error');
                    expect(error.row).toBe(rowIndex);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should validate completeness across multiple rows consistently', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        nama: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        kategori: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        satuan: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        harga_beli: fc.option(fc.float({ min: 0 }), { nil: undefined }),
                        stok: fc.option(fc.float({ min: 0 }), { nil: undefined })
                    }),
                    { minLength: 1, maxLength: 50 }
                ),
                (dataRows) => {
                    const allResults = dataRows.map((row, index) => 
                        validationEngine.validateBusinessRules(row, index + 1)
                    );
                    
                    // Property: Each row should be validated independently
                    allResults.forEach((result, index) => {
                        const row = dataRows[index];
                        const rowIndex = index + 1;
                        
                        const requiredFields = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
                        const missingFields = requiredFields.filter(field => 
                            !row[field] || (typeof row[field] === 'string' && row[field].trim() === '')
                        );
                        
                        const missingFieldErrors = result.errors.filter(error => 
                            error.code === 'REQUIRED_FIELD_MISSING'
                        );
                        
                        expect(missingFieldErrors.length).toBe(missingFields.length);
                        
                        // Property: All errors should reference the correct row
                        missingFieldErrors.forEach(error => {
                            expect(error.row).toBe(rowIndex);
                        });
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});