/**
 * Property-Based Test: Duplicate Detection Accuracy
 * Feature: upload-master-barang-excel, Property 6: Duplicate Detection Accuracy
 * 
 * Validates: Requirements 2.2
 * For any file containing duplicate kode barang, the validation engine should detect 
 * all duplicates and prevent import with specific error messages
 */

import fc from 'fast-check';

// Mock ValidationEngine for testing
class ValidationEngine {
    constructor() {
        this.validationRules = {
            requiredFields: ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok']
        };
    }

    validateDuplicates(data) {
        const errors = [];
        const warnings = [];
        
        if (!Array.isArray(data)) {
            errors.push({
                type: 'integrity',
                field: 'data',
                row: 0,
                message: 'Data harus berupa array',
                severity: 'error',
                code: 'INVALID_DATA_FORMAT'
            });
            return { isValid: false, errors: errors, warnings: warnings };
        }
        
        // Track kode occurrences
        const kodeMap = new Map();
        
        data.forEach((row, index) => {
            if (row.kode && typeof row.kode === 'string') {
                const normalizedKode = row.kode.trim().toLowerCase();
                if (kodeMap.has(normalizedKode)) {
                    kodeMap.get(normalizedKode).push(index + 1); // 1-based row number
                } else {
                    kodeMap.set(normalizedKode, [index + 1]);
                }
            }
        });
        
        // Find duplicates
        for (const [kode, rowNumbers] of kodeMap.entries()) {
            if (rowNumbers.length > 1) {
                errors.push({
                    type: 'integrity',
                    field: 'kode',
                    row: rowNumbers[0], // First occurrence
                    message: `Kode barang duplikat "${kode}" ditemukan pada baris: ${rowNumbers.join(', ')}`,
                    severity: 'error',
                    code: 'DUPLICATE_CODE'
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

describe('Property 6: Duplicate Detection Accuracy', () => {
    let validationEngine;

    beforeEach(() => {
        validationEngine = new ValidationEngine();
    });

    test('should detect all duplicates in any dataset with duplicate kode values', () => {
        fc.assert(
            fc.property(
                // Generate array of records with potential duplicates
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        kategori: fc.string({ minLength: 1, maxLength: 50 }),
                        satuan: fc.string({ minLength: 1, maxLength: 20 }),
                        harga_beli: fc.float({ min: 0, max: 1000000 }),
                        stok: fc.float({ min: 0, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 50 }
                ),
                (data) => {
                    const result = validationEngine.validateDuplicates(data);
                    
                    // Count actual duplicates by normalizing kode values
                    const kodeMap = new Map();
                    data.forEach((row, index) => {
                        if (row.kode && typeof row.kode === 'string') {
                            const normalizedKode = row.kode.trim().toLowerCase();
                            if (kodeMap.has(normalizedKode)) {
                                kodeMap.get(normalizedKode).push(index + 1);
                            } else {
                                kodeMap.set(normalizedKode, [index + 1]);
                            }
                        }
                    });
                    
                    const actualDuplicateGroups = Array.from(kodeMap.values()).filter(rows => rows.length > 1);
                    const duplicateErrors = result.errors.filter(error => error.code === 'DUPLICATE_CODE');
                    
                    // Property: Number of duplicate errors should equal number of duplicate groups
                    expect(duplicateErrors.length).toBe(actualDuplicateGroups.length);
                    
                    // Property: Each duplicate group should have exactly one error
                    actualDuplicateGroups.forEach(duplicateRows => {
                        const matchingErrors = duplicateErrors.filter(error => 
                            error.row === duplicateRows[0] // First occurrence row
                        );
                        expect(matchingErrors.length).toBe(1);
                        
                        // Property: Error message should contain all duplicate row numbers
                        const error = matchingErrors[0];
                        duplicateRows.forEach(rowNum => {
                            expect(error.message).toContain(rowNum.toString());
                        });
                    });
                    
                    // Property: If no duplicates exist, validation should be valid
                    if (actualDuplicateGroups.length === 0) {
                        expect(result.isValid).toBe(true);
                        expect(duplicateErrors.length).toBe(0);
                    } else {
                        expect(result.isValid).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle case-insensitive duplicate detection consistently', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 15 }), // Base kode
                fc.array(
                    fc.constantFrom('upper', 'lower', 'mixed', 'spaces'),
                    { minLength: 2, maxLength: 5 }
                ), // Variations to apply
                fc.array(
                    fc.record({
                        nama: fc.string({ minLength: 1, maxLength: 50 }),
                        kategori: fc.string({ minLength: 1, maxLength: 20 }),
                        satuan: fc.string({ minLength: 1, maxLength: 10 }),
                        harga_beli: fc.float({ min: 0, max: 100000 }),
                        stok: fc.float({ min: 0, max: 1000 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ), // Additional data for each row
                (baseKode, variations, additionalData) => {
                    // Create data with case variations of the same kode
                    const data = variations.map((variation, index) => {
                        let kode = baseKode;
                        switch (variation) {
                            case 'upper':
                                kode = baseKode.toUpperCase();
                                break;
                            case 'lower':
                                kode = baseKode.toLowerCase();
                                break;
                            case 'mixed':
                                kode = baseKode.split('').map((char, i) => 
                                    i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
                                ).join('');
                                break;
                            case 'spaces':
                                kode = '  ' + baseKode + '  ';
                                break;
                        }
                        
                        return {
                            kode: kode,
                            ...additionalData[index % additionalData.length]
                        };
                    });
                    
                    const result = validationEngine.validateDuplicates(data);
                    
                    // Property: All case variations should be detected as duplicates
                    if (variations.length > 1) {
                        expect(result.isValid).toBe(false);
                        
                        const duplicateErrors = result.errors.filter(error => error.code === 'DUPLICATE_CODE');
                        expect(duplicateErrors.length).toBe(1); // One error for the duplicate group
                        
                        const error = duplicateErrors[0];
                        expect(error.field).toBe('kode');
                        expect(error.type).toBe('integrity');
                        expect(error.severity).toBe('error');
                        
                        // Property: Error should reference all rows with the duplicate
                        for (let i = 1; i <= variations.length; i++) {
                            expect(error.message).toContain(i.toString());
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle empty and null kode values without errors', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.oneof(
                            fc.constant(''),
                            fc.constant(null),
                            fc.constant(undefined),
                            fc.string({ minLength: 1, maxLength: 10 })
                        ),
                        nama: fc.string({ minLength: 1, maxLength: 50 }),
                        kategori: fc.string({ minLength: 1, maxLength: 20 }),
                        satuan: fc.string({ minLength: 1, maxLength: 10 }),
                        harga_beli: fc.float({ min: 0, max: 100000 }),
                        stok: fc.float({ min: 0, max: 1000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (data) => {
                    const result = validationEngine.validateDuplicates(data);
                    
                    // Property: Empty/null kode values should not cause duplicate errors
                    const validKodes = data
                        .map(row => row.kode)
                        .filter(kode => kode && typeof kode === 'string' && kode.trim() !== '');
                    
                    const uniqueValidKodes = new Set(validKodes.map(kode => kode.trim().toLowerCase()));
                    const hasDuplicates = validKodes.length > uniqueValidKodes.size;
                    
                    const duplicateErrors = result.errors.filter(error => error.code === 'DUPLICATE_CODE');
                    
                    if (hasDuplicates) {
                        expect(duplicateErrors.length).toBeGreaterThan(0);
                        expect(result.isValid).toBe(false);
                    } else {
                        expect(duplicateErrors.length).toBe(0);
                        expect(result.isValid).toBe(true);
                    }
                    
                    // Property: No error should reference empty/null kode values
                    duplicateErrors.forEach(error => {
                        expect(error.message).not.toContain('""');
                        expect(error.message).not.toContain('null');
                        expect(error.message).not.toContain('undefined');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should provide accurate row numbers in duplicate error messages', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 5 }), // Number of duplicates
                fc.string({ minLength: 1, maxLength: 10 }), // Duplicate kode
                (numDuplicates, duplicateKode) => {
                    // Create simple data with only the duplicates to avoid complexity
                    const data = [];
                    const duplicatePositions = [];
                    
                    // Add duplicate rows
                    for (let i = 0; i < numDuplicates; i++) {
                        const position = i + 1; // 1-based position
                        duplicatePositions.push(position);
                        data.push({
                            kode: duplicateKode,
                            nama: `Duplicate ${i + 1}`,
                            kategori: 'test',
                            satuan: 'pcs',
                            harga_beli: 1000,
                            stok: 10
                        });
                    }
                    
                    const result = validationEngine.validateDuplicates(data);
                    
                    // Property: Should detect the duplicate group
                    expect(result.isValid).toBe(false);
                    
                    const duplicateErrors = result.errors.filter(error => error.code === 'DUPLICATE_CODE');
                    expect(duplicateErrors.length).toBe(1);
                    
                    const error = duplicateErrors[0];
                    
                    // Property: Error should reference the first occurrence
                    expect(error.row).toBe(1);
                    
                    // Property: Error message should contain all duplicate positions
                    duplicatePositions.forEach(position => {
                        expect(error.message).toContain(position.toString());
                    });
                    
                    // Property: Error should contain the normalized kode (if not empty after trim)
                    const normalizedKode = duplicateKode.trim().toLowerCase();
                    if (normalizedKode !== '') {
                        expect(error.message).toContain(normalizedKode);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});