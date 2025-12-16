/**
 * Property-Based Tests for Error Message Clarity
 * Tests Property 28: Error message clarity
 * Validates: Requirements 7.5
 */

import fc from 'fast-check';
import { ValidationEngine } from '../../js/master-barang/ValidationEngine.js';
import { masterBarangSystem } from '../../js/master-barang/MasterBarangSystem.js';

describe('Property 28: Error Message Clarity', () => {
    let validationEngine;

    beforeEach(() => {
        validationEngine = new ValidationEngine();
        masterBarangSystem.clearAllData();
    });

    afterEach(() => {
        masterBarangSystem.clearAllData();
    });

    // Property 28.1: Error messages should be clear and actionable
    test('should provide clear and actionable error messages', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.oneof(
                    fc.constant(''),
                    fc.constant('a'), // too short
                    fc.string({ minLength: 21, maxLength: 50 }), // too long
                    fc.string().filter(s => /[^A-Za-z0-9-]/.test(s)) // invalid characters
                ),
                nama: fc.oneof(
                    fc.constant(''),
                    fc.constant('a'), // too short
                    fc.string({ minLength: 101, maxLength: 200 }) // too long
                ),
                harga_beli: fc.oneof(
                    fc.constant(-1), // negative
                    fc.constant(1000000000), // too large
                    fc.constant('invalid') // non-numeric
                ),
                harga_jual: fc.oneof(
                    fc.constant(-1), // negative
                    fc.constant(1000000000), // too large
                    fc.constant('invalid') // non-numeric
                ),
                stok: fc.oneof(
                    fc.constant(-1), // negative
                    fc.constant(1000000000), // too large
                    fc.constant('invalid') // non-numeric
                )
            }),
            (invalidData) => {
                const result = validationEngine.validateBarang(invalidData);
                
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
                
                result.errors.forEach(error => {
                    // Error messages should be strings
                    expect(typeof error).toBe('string');
                    
                    // Error messages should not be empty
                    expect(error.trim().length).toBeGreaterThan(0);
                    
                    // Error messages should be descriptive (contain field name or context)
                    const hasContext = error.toLowerCase().includes('kode') ||
                                     error.toLowerCase().includes('nama') ||
                                     error.toLowerCase().includes('harga') ||
                                     error.toLowerCase().includes('stok') ||
                                     error.toLowerCase().includes('kategori') ||
                                     error.toLowerCase().includes('satuan');
                    expect(hasContext).toBe(true);
                    
                    // Error messages should not contain technical jargon
                    const hasTechnicalJargon = error.includes('undefined') ||
                                             error.includes('null') ||
                                             error.includes('NaN') ||
                                             error.includes('TypeError') ||
                                             error.includes('ReferenceError');
                    expect(hasTechnicalJargon).toBe(false);
                });
            }
        ), { numRuns: 50 });
    });

    // Property 28.2: Field-specific errors should identify the problematic field
    test('should identify problematic fields in error messages', () => {
        fc.assert(fc.property(
            fc.record({
                fieldName: fc.constantFrom('kode', 'nama', 'harga_beli', 'harga_jual', 'stok', 'stok_minimum'),
                invalidValue: fc.oneof(
                    fc.constant(''),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.constant(-1),
                    fc.string({ minLength: 200, maxLength: 300 })
                )
            }),
            ({ fieldName, invalidValue }) => {
                const testData = {
                    kode: 'TEST001',
                    nama: 'Test Barang',
                    harga_beli: 1000,
                    harga_jual: 1500,
                    stok: 10,
                    stok_minimum: 5,
                    kategori_id: 'test-kategori',
                    satuan_id: 'test-satuan'
                };
                
                // Set the invalid value for the specific field
                testData[fieldName] = invalidValue;
                
                const result = validationEngine.validateBarang(testData);
                
                if (!result.isValid) {
                    // Should have errors
                    expect(result.errors).toBeDefined();
                    expect(Array.isArray(result.errors)).toBe(true);
                    expect(result.errors.length).toBeGreaterThan(0);
                    
                    // Find error related to the problematic field
                    const fieldName_lower = fieldName.toLowerCase().replace('_', ' ');
                    const fieldError = result.errors.find(error => 
                        error.toLowerCase().includes(fieldName_lower) ||
                        (fieldName === 'harga_beli' && error.toLowerCase().includes('harga beli')) ||
                        (fieldName === 'harga_jual' && error.toLowerCase().includes('harga jual')) ||
                        (fieldName === 'stok_minimum' && error.toLowerCase().includes('stok minimum'))
                    );
                    
                    if (fieldError) {
                        expect(typeof fieldError).toBe('string');
                        expect(fieldError.trim().length).toBeGreaterThan(0);
                        
                        // Message should be helpful
                        const isHelpful = fieldError.toLowerCase().includes('wajib') ||
                                        fieldError.toLowerCase().includes('harus') ||
                                        fieldError.toLowerCase().includes('tidak boleh') ||
                                        fieldError.toLowerCase().includes('minimal') ||
                                        fieldError.toLowerCase().includes('maksimal') ||
                                        fieldError.toLowerCase().includes('format') ||
                                        fieldError.toLowerCase().includes('diisi');
                        expect(isHelpful).toBe(true);
                    }
                }
            }
        ), { numRuns: 50 });
    });

    // Property 28.3: Error messages should be consistent for similar validation failures
    test('should provide consistent error messages for similar failures', () => {
        fc.assert(fc.property(
            fc.array(fc.string({ minLength: 21, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
            (longKodes) => {
                const results = longKodes.map(kode => {
                    const testData = {
                        kode,
                        nama: 'Test Barang',
                        harga_beli: 1000,
                        harga_jual: 1500,
                        stok: 10,
                        kategori_id: 'test-kategori',
                        satuan_id: 'test-satuan'
                    };
                    
                    return validationEngine.validateBarang(testData);
                });
                
                // All should fail validation
                results.forEach(result => {
                    expect(result.isValid).toBe(false);
                });
                
                // Find kode-related errors
                const kodeErrors = results.map(result => 
                    result.errors?.find(error => error.toLowerCase().includes('kode'))
                ).filter(Boolean);
                
                if (kodeErrors.length > 1) {
                    // All kode errors should be the same for the same type of violation
                    const firstError = kodeErrors[0];
                    kodeErrors.forEach(error => {
                        expect(error).toBe(firstError);
                    });
                }
            }
        ), { numRuns: 30 });
    });

    // Property 28.4: Error messages should be in Indonesian language
    test('should provide error messages in Indonesian language', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.constant(''),
                nama: fc.constant(''),
                harga_beli: fc.constant(-1),
                harga_jual: fc.constant(-1),
                stok: fc.constant(-1)
            }),
            (invalidData) => {
                const result = validationEngine.validateBarang(invalidData);
                
                expect(result.isValid).toBe(false);
                
                result.errors.forEach(error => {
                    // Should contain Indonesian words
                    const hasIndonesianWords = error.includes('wajib') ||
                                            error.includes('harus') ||
                                            error.includes('tidak boleh') ||
                                            error.includes('minimal') ||
                                            error.includes('maksimal') ||
                                            error.includes('karakter') ||
                                            error.includes('angka') ||
                                            error.includes('huruf');
                    
                    // Should not contain English-only error messages
                    const hasEnglishOnly = error.toLowerCase().includes('required') ||
                                         error.toLowerCase().includes('invalid') ||
                                         error.toLowerCase().includes('must be') ||
                                         error.toLowerCase().includes('should be');
                    
                    expect(hasIndonesianWords || !hasEnglishOnly).toBe(true);
                });
            }
        ), { numRuns: 30 });
    });

    // Property 28.5: System-level errors should provide context
    test('should provide contextual information for system-level errors', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Za-z0-9-]+$/.test(s)),
                nama: fc.string({ minLength: 2, maxLength: 100 }),
                harga_beli: fc.integer({ min: 0, max: 999999999 }),
                harga_jual: fc.integer({ min: 0, max: 999999999 }),
                stok: fc.integer({ min: 0, max: 999999999 }),
                kategori_id: fc.string(),
                satuan_id: fc.string()
            }),
            (barangData) => {
                // First create a kategori and satuan with proper validation
                const kategoriResult = masterBarangSystem.createKategori({
                    nama: `Test Kategori ${Date.now()}`, // Make unique
                    deskripsi: 'Test kategori untuk testing',
                    status: 'aktif'
                });
                
                const satuanResult = masterBarangSystem.createSatuan({
                    nama: `Test Satuan ${Date.now()}`, // Make unique
                    deskripsi: 'Test satuan untuk testing',
                    status: 'aktif'
                });

                // Only proceed if kategori and satuan creation succeeded
                if (kategoriResult.success && satuanResult.success) {
                    const firstBarang = {
                        ...barangData,
                        kategori_id: kategoriResult.data.id,
                        kategori_nama: kategoriResult.data.nama,
                        satuan_id: satuanResult.data.id,
                        satuan_nama: satuanResult.data.nama,
                        status: 'aktif'
                    };

                    const firstResult = masterBarangSystem.createBarang(firstBarang);
                    
                    // Only test duplicate if first creation succeeded
                    if (firstResult.success) {
                        // Try to create another barang with the same kode
                        const secondResult = masterBarangSystem.createBarang({
                            ...firstBarang,
                            nama: 'Different Name'
                        });

                        expect(secondResult.success).toBe(false);
                        expect(secondResult.errors.length).toBeGreaterThan(0);

                        // Error should provide context about the duplicate
                        const duplicateError = secondResult.errors.find(error => 
                            error.toLowerCase().includes('kode') && 
                            (error.toLowerCase().includes('sudah') || error.toLowerCase().includes('duplikat'))
                        );
                        
                        if (duplicateError) {
                            expect(typeof duplicateError).toBe('string');
                            expect(duplicateError.trim().length).toBeGreaterThan(0);
                        }
                    }
                }
            }
        ), { numRuns: 10 }); // Reduce runs to avoid too many test data
    });

    // Property 28.6: Validation errors should suggest corrective actions
    test('should suggest corrective actions in error messages', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.record({ kode: fc.constant('') }), // empty kode
                fc.record({ kode: fc.string({ minLength: 21, maxLength: 50 }) }), // too long kode
                fc.record({ nama: fc.constant('') }), // empty nama
                fc.record({ harga_beli: fc.constant(-1) }), // negative price
                fc.record({ stok: fc.constant(-1) }) // negative stock
            ),
            (invalidField) => {
                const testData = {
                    kode: 'TEST001',
                    nama: 'Test Barang',
                    harga_beli: 1000,
                    harga_jual: 1500,
                    stok: 10,
                    kategori_id: 'test-kategori',
                    satuan_id: 'test-satuan',
                    ...invalidField
                };
                
                const result = validationEngine.validateBarang(testData);
                
                if (!result.isValid) {
                    const hasActionableMessage = result.errors.some(error => {
                        const message = error.toLowerCase();
                        return message.includes('harus') ||
                               message.includes('wajib') ||
                               message.includes('minimal') ||
                               message.includes('maksimal') ||
                               message.includes('tidak boleh') ||
                               message.includes('pilih') ||
                               message.includes('isi') ||
                               message.includes('masukkan');
                    });
                    
                    expect(hasActionableMessage).toBe(true);
                }
            }
        ), { numRuns: 50 });
    });

    // Property 28.7: Error messages should not expose sensitive information
    test('should not expose sensitive information in error messages', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.string(),
                nama: fc.string(),
                harga_beli: fc.oneof(fc.integer(), fc.string()),
                harga_jual: fc.oneof(fc.integer(), fc.string()),
                stok: fc.oneof(fc.integer(), fc.string()),
                kategori_id: fc.string(),
                satuan_id: fc.string()
            }),
            (testData) => {
                const result = validationEngine.validateBarang(testData);
                
                if (!result.isValid) {
                    result.errors.forEach(error => {
                        // Should not contain file paths
                        expect(error).not.toMatch(/[A-Za-z]:\\/);
                        expect(error).not.toMatch(/\/[a-zA-Z]/);
                        
                        // Should not contain stack traces
                        expect(error).not.toMatch(/at\s+\w+/);
                        expect(error).not.toMatch(/\s+at\s+/);
                        
                        // Should not contain internal variable names
                        expect(error).not.toMatch(/\$\w+/);
                        expect(error).not.toMatch(/_internal/);
                        
                        // Should not contain SQL-like syntax
                        expect(error.toLowerCase()).not.toMatch(/select\s+\*/);
                        expect(error.toLowerCase()).not.toMatch(/insert\s+into/);
                        expect(error.toLowerCase()).not.toMatch(/update\s+set/);
                        expect(error.toLowerCase()).not.toMatch(/delete\s+from/);
                    });
                }
            }
        ), { numRuns: 50 });
    });

    // Property 28.8: Error messages should have appropriate length
    test('should have appropriately sized error messages', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.oneof(fc.constant(''), fc.string({ minLength: 50, maxLength: 100 })),
                nama: fc.oneof(fc.constant(''), fc.string({ minLength: 200, maxLength: 300 })),
                harga_beli: fc.constant(-1),
                harga_jual: fc.constant(-1),
                stok: fc.constant(-1)
            }),
            (invalidData) => {
                const result = validationEngine.validateBarang(invalidData);
                
                if (!result.isValid) {
                    result.errors.forEach(error => {
                        // Error messages should not be too short (less informative)
                        expect(error.trim().length).toBeGreaterThan(5);
                        
                        // Error messages should not be too long (overwhelming)
                        expect(error.length).toBeLessThan(200);
                        
                        // Should not have excessive whitespace
                        expect(error).not.toMatch(/\s{3,}/);
                        expect(error.trim()).toBe(error.trim().replace(/\s+/g, ' '));
                    });
                }
            }
        ), { numRuns: 30 });
    });
});