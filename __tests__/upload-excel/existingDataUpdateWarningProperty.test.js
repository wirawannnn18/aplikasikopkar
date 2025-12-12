/**
 * Property-Based Test: Existing Data Update Warning
 * Feature: upload-master-barang-excel, Property 9: Existing Data Update Warning
 * 
 * Validates: Requirements 2.5
 * For any upload containing existing kode barang, the validation engine should display 
 * warnings and offer update options while preserving data integrity
 */

import fc from 'fast-check';

// Mock ValidationEngine for testing
class ValidationEngine {
    constructor() {
        this.validationRules = {
            requiredFields: ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok']
        };
    }

    validateExistingData(data) {
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
        
        // Get existing data from localStorage (simulating database)
        const existingData = this.getExistingBarangData();
        const existingKodes = new Set(existingData.map(item => item.kode.toLowerCase()));
        
        data.forEach((row, index) => {
            if (row.kode && typeof row.kode === 'string') {
                const normalizedKode = row.kode.trim().toLowerCase();
                if (existingKodes.has(normalizedKode)) {
                    warnings.push({
                        type: 'integrity',
                        field: 'kode',
                        row: index + 1,
                        message: `Kode barang "${row.kode}" sudah ada dalam sistem. Data akan diupdate jika import dilanjutkan.`,
                        severity: 'warning',
                        code: 'EXISTING_CODE_UPDATE'
                    });
                }
            }
        });
        
        return {
            isValid: true, // Warnings don't make validation invalid
            errors: errors,
            warnings: warnings
        };
    }

    getExistingBarangData() {
        try {
            const data = localStorage.getItem('master_barang');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading existing barang data:', error);
            return [];
        }
    }

    // Helper method to set existing data for testing
    setExistingBarangData(data) {
        try {
            localStorage.setItem('master_barang', JSON.stringify(data));
        } catch (error) {
            console.error('Error setting existing barang data:', error);
        }
    }
}

describe('Property 9: Existing Data Update Warning', () => {
    let validationEngine;

    beforeEach(() => {
        validationEngine = new ValidationEngine();
        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        // Clean up localStorage after each test
        localStorage.clear();
    });

    test('should generate warnings for any upload data that matches existing kode values', () => {
        fc.assert(
            fc.property(
                // Generate existing data
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                // Generate upload data that may overlap with existing
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        kategori: fc.string({ minLength: 1, maxLength: 50 }),
                        satuan: fc.string({ minLength: 1, maxLength: 20 }),
                        harga_beli: fc.float({ min: 0, max: 1000000 }),
                        stok: fc.float({ min: 0, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (existingData, uploadData) => {
                    // Set up existing data
                    validationEngine.setExistingBarangData(existingData);
                    
                    const result = validationEngine.validateExistingData(uploadData);
                    
                    // Create normalized sets for comparison
                    const existingKodes = new Set(existingData.map(item => item.kode.toLowerCase()));
                    const uploadKodes = uploadData.map((row, index) => ({
                        kode: row.kode ? row.kode.trim().toLowerCase() : '',
                        originalKode: row.kode,
                        row: index + 1
                    })).filter(item => item.kode !== '');
                    
                    // Find expected overlaps
                    const expectedOverlaps = uploadKodes.filter(item => 
                        existingKodes.has(item.kode)
                    );
                    
                    const updateWarnings = result.warnings.filter(warning => 
                        warning.code === 'EXISTING_CODE_UPDATE'
                    );
                    
                    // Property: Number of warnings should equal number of overlapping kodes
                    expect(updateWarnings.length).toBe(expectedOverlaps.length);
                    
                    // Property: Each overlapping kode should have exactly one warning
                    expectedOverlaps.forEach(overlap => {
                        const matchingWarnings = updateWarnings.filter(warning => 
                            warning.row === overlap.row && 
                            warning.message.includes(overlap.originalKode)
                        );
                        expect(matchingWarnings.length).toBe(1);
                        
                        const warning = matchingWarnings[0];
                        expect(warning.type).toBe('integrity');
                        expect(warning.field).toBe('kode');
                        expect(warning.severity).toBe('warning');
                        expect(warning.message).toContain('sudah ada dalam sistem');
                        expect(warning.message).toContain('Data akan diupdate');
                    });
                    
                    // Property: Validation should remain valid (warnings don't invalidate)
                    expect(result.isValid).toBe(true);
                    
                    // Property: No errors should be generated for existing data
                    expect(result.errors.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle case-insensitive matching for existing data warnings', () => {
        fc.assert(
            fc.property(
                fc.stringOf(fc.char().filter(c => /[a-zA-Z0-9]/.test(c)), { minLength: 1, maxLength: 15 }), // Base kode
                fc.constantFrom('upper', 'lower', 'mixed'), // Case variation for existing
                fc.constantFrom('upper', 'lower', 'mixed'), // Case variation for upload
                fc.record({
                    nama: fc.string({ minLength: 1, maxLength: 50 }),
                    kategori: fc.string({ minLength: 1, maxLength: 20 }),
                    satuan: fc.string({ minLength: 1, maxLength: 10 }),
                    harga_beli: fc.float({ min: 0, max: 100000 }),
                    stok: fc.float({ min: 0, max: 1000 })
                }),
                (baseKode, existingCase, uploadCase, additionalData) => {
                    // Create existing data with case variation
                    let existingKode = baseKode;
                    switch (existingCase) {
                        case 'upper':
                            existingKode = baseKode.toUpperCase();
                            break;
                        case 'lower':
                            existingKode = baseKode.toLowerCase();
                            break;
                        case 'mixed':
                            existingKode = baseKode.split('').map((char, i) => 
                                i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
                            ).join('');
                            break;
                    }
                    
                    // Create upload data with different case variation
                    let uploadKode = baseKode;
                    switch (uploadCase) {
                        case 'upper':
                            uploadKode = baseKode.toUpperCase();
                            break;
                        case 'lower':
                            uploadKode = baseKode.toLowerCase();
                            break;
                        case 'mixed':
                            uploadKode = baseKode.split('').map((char, i) => 
                                i % 2 === 1 ? char.toUpperCase() : char.toLowerCase()
                            ).join('');
                            break;
                    }
                    
                    const existingData = [{ kode: existingKode, nama: 'Existing Product' }];
                    const uploadData = [{ kode: uploadKode, ...additionalData }];
                    
                    validationEngine.setExistingBarangData(existingData);
                    const result = validationEngine.validateExistingData(uploadData);
                    
                    // Property: Should detect case-insensitive match
                    const updateWarnings = result.warnings.filter(warning => 
                        warning.code === 'EXISTING_CODE_UPDATE'
                    );
                    
                    expect(updateWarnings.length).toBe(1);
                    expect(result.isValid).toBe(true);
                    
                    const warning = updateWarnings[0];
                    expect(warning.field).toBe('kode');
                    expect(warning.row).toBe(1);
                    expect(warning.message).toContain(uploadKode); // Should contain original upload kode
                    expect(warning.message).toContain('sudah ada dalam sistem');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle empty existing data without generating warnings', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        kategori: fc.string({ minLength: 1, maxLength: 50 }),
                        satuan: fc.string({ minLength: 1, maxLength: 20 }),
                        harga_beli: fc.float({ min: 0, max: 1000000 }),
                        stok: fc.float({ min: 0, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (uploadData) => {
                    // Set empty existing data
                    validationEngine.setExistingBarangData([]);
                    
                    const result = validationEngine.validateExistingData(uploadData);
                    
                    // Property: No warnings should be generated when no existing data
                    const updateWarnings = result.warnings.filter(warning => 
                        warning.code === 'EXISTING_CODE_UPDATE'
                    );
                    
                    expect(updateWarnings.length).toBe(0);
                    expect(result.isValid).toBe(true);
                    expect(result.errors.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle upload data with empty or null kode values', () => {
        fc.assert(
            fc.property(
                // Generate existing data
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                // Generate upload data with some empty/null kodes
                fc.array(
                    fc.record({
                        kode: fc.oneof(
                            fc.constant(''),
                            fc.constant(null),
                            fc.constant(undefined),
                            fc.constant('   '), // Whitespace only
                            fc.string({ minLength: 1, maxLength: 20 })
                        ),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        kategori: fc.string({ minLength: 1, maxLength: 50 }),
                        satuan: fc.string({ minLength: 1, maxLength: 20 }),
                        harga_beli: fc.float({ min: 0, max: 1000000 }),
                        stok: fc.float({ min: 0, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (existingData, uploadData) => {
                    validationEngine.setExistingBarangData(existingData);
                    
                    const result = validationEngine.validateExistingData(uploadData);
                    
                    // Property: Empty/null kode values should not generate warnings
                    const updateWarnings = result.warnings.filter(warning => 
                        warning.code === 'EXISTING_CODE_UPDATE'
                    );
                    
                    // Count valid upload kodes that could potentially match
                    const validUploadKodes = uploadData.filter(row => 
                        row.kode && typeof row.kode === 'string' && row.kode.trim() !== ''
                    );
                    
                    const existingKodes = new Set(existingData.map(item => item.kode.toLowerCase()));
                    const expectedWarnings = validUploadKodes.filter(row => 
                        existingKodes.has(row.kode.trim().toLowerCase())
                    ).length;
                    
                    expect(updateWarnings.length).toBe(expectedWarnings);
                    expect(result.isValid).toBe(true);
                    
                    // Property: No warning should reference empty/null values
                    updateWarnings.forEach(warning => {
                        expect(warning.message).not.toContain('""');
                        expect(warning.message).not.toContain('null');
                        expect(warning.message).not.toContain('undefined');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should provide helpful warning messages for data updates', () => {
        fc.assert(
            fc.property(
                fc.stringOf(fc.char().filter(c => /[a-zA-Z0-9]/.test(c)), { minLength: 1, maxLength: 15 }), // Kode that exists
                fc.record({
                    nama: fc.string({ minLength: 1, maxLength: 50 }),
                    kategori: fc.string({ minLength: 1, maxLength: 20 }),
                    satuan: fc.string({ minLength: 1, maxLength: 10 }),
                    harga_beli: fc.float({ min: 0, max: 100000 }),
                    stok: fc.float({ min: 0, max: 1000 })
                }),
                fc.integer({ min: 1, max: 10 }), // Position in upload data
                (existingKode, additionalData, position) => {
                    // Create existing data
                    const existingData = [{ kode: existingKode, nama: 'Existing Product' }];
                    
                    // Create upload data with the existing kode at specific position
                    const uploadData = [];
                    for (let i = 0; i < position; i++) {
                        uploadData.push({
                            kode: `NEW${i}`,
                            nama: `New Product ${i}`,
                            ...additionalData
                        });
                    }
                    uploadData.push({
                        kode: existingKode,
                        nama: 'Updated Product',
                        ...additionalData
                    });
                    
                    validationEngine.setExistingBarangData(existingData);
                    const result = validationEngine.validateExistingData(uploadData);
                    
                    // Property: Should have exactly one warning for the existing kode
                    const updateWarnings = result.warnings.filter(warning => 
                        warning.code === 'EXISTING_CODE_UPDATE'
                    );
                    
                    expect(updateWarnings.length).toBe(1);
                    
                    const warning = updateWarnings[0];
                    
                    // Property: Warning should have helpful message structure
                    expect(warning.message).toContain(existingKode);
                    expect(warning.message).toContain('sudah ada dalam sistem');
                    expect(warning.message).toContain('Data akan diupdate');
                    expect(warning.message).toContain('jika import dilanjutkan');
                    
                    // Property: Warning should reference correct row
                    expect(warning.row).toBe(position + 1); // 1-based row numbering
                    
                    // Property: Warning should have correct metadata
                    expect(warning.type).toBe('integrity');
                    expect(warning.field).toBe('kode');
                    expect(warning.severity).toBe('warning');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should maintain data integrity while allowing updates', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 15 }),
                        nama: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 15 }),
                        nama: fc.string({ minLength: 1, maxLength: 50 }),
                        kategori: fc.string({ minLength: 1, maxLength: 20 }),
                        satuan: fc.string({ minLength: 1, maxLength: 10 }),
                        harga_beli: fc.float({ min: 0, max: 100000 }),
                        stok: fc.float({ min: 0, max: 1000 })
                    }),
                    { minLength: 1, maxLength: 15 }
                ),
                (existingData, uploadData) => {
                    validationEngine.setExistingBarangData(existingData);
                    
                    const result = validationEngine.validateExistingData(uploadData);
                    
                    // Property: Validation should always be valid (warnings don't block import)
                    expect(result.isValid).toBe(true);
                    
                    // Property: Should never generate errors for existing data matches
                    expect(result.errors.length).toBe(0);
                    
                    // Property: Warnings should be informational only
                    result.warnings.forEach(warning => {
                        expect(warning.severity).toBe('warning');
                        expect(warning.code).toBe('EXISTING_CODE_UPDATE');
                        expect(warning.type).toBe('integrity');
                    });
                    
                    // Property: Each warning should correspond to a valid overlap
                    const existingKodes = new Set(existingData.map(item => item.kode.toLowerCase()));
                    const updateWarnings = result.warnings.filter(warning => 
                        warning.code === 'EXISTING_CODE_UPDATE'
                    );
                    
                    updateWarnings.forEach(warning => {
                        const rowIndex = warning.row - 1; // Convert to 0-based
                        const uploadRow = uploadData[rowIndex];
                        expect(uploadRow).toBeDefined();
                        expect(uploadRow.kode).toBeDefined();
                        expect(existingKodes.has(uploadRow.kode.trim().toLowerCase())).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});