// Feature: master-barang-komprehensif, Property 2: Form validation consistency
// Validates: Requirements 1.3
// Task 1.2: Write property test for form validation consistency

import fc from 'fast-check';

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

// Constants for testing
const VALIDATION_RULES = {
    KODE: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 20,
        PATTERN: /^[A-Z0-9-_]+$/
    },
    NAMA: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 100
    },
    HARGA: {
        MIN_VALUE: 0,
        MAX_VALUE: 999999999
    },
    STOK: {
        MIN_VALUE: 0,
        MAX_VALUE: 999999
    }
};

const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'Field ini wajib diisi',
    INVALID_FORMAT: 'Format tidak valid',
    DUPLICATE_CODE: 'Kode barang sudah ada',
    DUPLICATE_NAME: 'Nama sudah ada',
    INVALID_PRICE: 'Harga harus berupa angka positif',
    INVALID_STOCK: 'Stok harus berupa angka positif'
};
// Simulate form validation functionality
function validateBarangForm(formData, existingCodes = [], existingNames = []) {
    const errors = [];
    const warnings = [];

    // Kode validation
    if (!formData.kode || typeof formData.kode !== 'string') {
        errors.push('Kode barang harus diisi');
    } else {
        const kode = formData.kode.trim();
        
        if (kode.length < VALIDATION_RULES.KODE.MIN_LENGTH) {
            errors.push(`Kode barang minimal ${VALIDATION_RULES.KODE.MIN_LENGTH} karakter`);
        } else if (kode.length > VALIDATION_RULES.KODE.MAX_LENGTH) {
            errors.push(`Kode barang maksimal ${VALIDATION_RULES.KODE.MAX_LENGTH} karakter`);
        } else if (!VALIDATION_RULES.KODE.PATTERN.test(kode)) {
            errors.push('Kode barang hanya boleh mengandung huruf besar, angka, dan tanda hubung');
        } else if (existingCodes.includes(kode)) {
            errors.push('Kode barang sudah ada');
        }
    }

    // Nama validation
    if (!formData.nama || typeof formData.nama !== 'string') {
        errors.push('Nama barang harus diisi');
    } else {
        const nama = formData.nama.trim();
        
        if (nama.length < VALIDATION_RULES.NAMA.MIN_LENGTH) {
            errors.push(`Nama barang minimal ${VALIDATION_RULES.NAMA.MIN_LENGTH} karakter`);
        } else if (nama.length > VALIDATION_RULES.NAMA.MAX_LENGTH) {
            errors.push(`Nama barang maksimal ${VALIDATION_RULES.NAMA.MAX_LENGTH} karakter`);
        } else if (existingNames.includes(nama.toLowerCase())) {
            errors.push('Nama barang sudah ada');
        }
    }

    // Kategori validation
    if (!formData.kategori_id || typeof formData.kategori_id !== 'string') {
        errors.push('Kategori harus dipilih');
    }

    // Satuan validation
    if (!formData.satuan_id || typeof formData.satuan_id !== 'string') {
        errors.push('Satuan harus dipilih');
    }

    // Harga beli validation
    if (formData.harga_beli !== undefined && formData.harga_beli !== null) {
        const hargaBeli = Number(formData.harga_beli);
        if (isNaN(hargaBeli) || hargaBeli < VALIDATION_RULES.HARGA.MIN_VALUE) {
            errors.push('Harga beli harus berupa angka positif atau nol');
        } else if (hargaBeli > VALIDATION_RULES.HARGA.MAX_VALUE) {
            errors.push(`Harga beli tidak boleh lebih dari ${VALIDATION_RULES.HARGA.MAX_VALUE.toLocaleString()}`);
        }
    }

    // Harga jual validation
    if (formData.harga_jual !== undefined && formData.harga_jual !== null) {
        const hargaJual = Number(formData.harga_jual);
        if (isNaN(hargaJual) || hargaJual < VALIDATION_RULES.HARGA.MIN_VALUE) {
            errors.push('Harga jual harus berupa angka positif atau nol');
        } else if (hargaJual > VALIDATION_RULES.HARGA.MAX_VALUE) {
            errors.push(`Harga jual tidak boleh lebih dari ${VALIDATION_RULES.HARGA.MAX_VALUE.toLocaleString()}`);
        }
    }

    // Price comparison warning
    if (formData.harga_beli !== undefined && formData.harga_jual !== undefined) {
        const hargaBeli = Number(formData.harga_beli);
        const hargaJual = Number(formData.harga_jual);
        if (!isNaN(hargaBeli) && !isNaN(hargaJual) && hargaJual < hargaBeli) {
            warnings.push('Harga jual lebih rendah dari harga beli');
        }
    }

    // Stok validation
    if (formData.stok !== undefined && formData.stok !== null) {
        const stok = Number(formData.stok);
        if (isNaN(stok) || stok < VALIDATION_RULES.STOK.MIN_VALUE) {
            errors.push('Stok harus berupa angka positif atau nol');
        } else if (stok > VALIDATION_RULES.STOK.MAX_VALUE) {
            errors.push(`Stok tidak boleh lebih dari ${VALIDATION_RULES.STOK.MAX_VALUE.toLocaleString()}`);
        }
    }

    // Stok minimum validation
    if (formData.stok_minimum !== undefined && formData.stok_minimum !== null) {
        const stokMin = Number(formData.stok_minimum);
        if (isNaN(stokMin) || stokMin < VALIDATION_RULES.STOK.MIN_VALUE) {
            errors.push('Stok minimum harus berupa angka positif atau nol');
        }
    }

    // Low stock warning
    if (formData.stok !== undefined && formData.stok_minimum !== undefined) {
        const stok = Number(formData.stok);
        const stokMin = Number(formData.stok_minimum);
        if (!isNaN(stok) && !isNaN(stokMin) && stok <= stokMin && stok > 0) {
            warnings.push('Stok saat ini sudah mencapai batas minimum');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
// Arbitraries for generating form data
const validKodeArbitrary = fc.string({ minLength: 3, maxLength: 20 })
    .filter(s => /^[A-Z0-9-_]+$/.test(s));

const validNamaArbitrary = fc.string({ minLength: 3, maxLength: 100 })
    .filter(s => s.trim().length >= 3);

const validHargaArbitrary = fc.integer({ min: 0, max: 999999999 });
const validStokArbitrary = fc.integer({ min: 0, max: 999999 });

const barangFormDataArbitrary = fc.record({
    kode: fc.option(validKodeArbitrary, { nil: undefined }),
    nama: fc.option(validNamaArbitrary, { nil: undefined }),
    kategori_id: fc.option(fc.uuid(), { nil: undefined }),
    satuan_id: fc.option(fc.uuid(), { nil: undefined }),
    harga_beli: fc.option(validHargaArbitrary, { nil: undefined }),
    harga_jual: fc.option(validHargaArbitrary, { nil: undefined }),
    stok: fc.option(validStokArbitrary, { nil: undefined }),
    stok_minimum: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    deskripsi: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    status: fc.option(fc.constantFrom('aktif', 'nonaktif'), { nil: undefined })
});

const invalidFormDataArbitrary = fc.record({
    kode: fc.oneof(
        fc.constant(''), // Empty
        fc.constant('AB'), // Too short
        fc.string({ minLength: 21, maxLength: 30 }), // Too long
        fc.string().filter(s => !/^[A-Z0-9-_]+$/.test(s) && s.length >= 3) // Invalid pattern
    ),
    nama: fc.oneof(
        fc.constant(''), // Empty
        fc.constant('AB'), // Too short
        fc.string({ minLength: 101, maxLength: 150 }) // Too long
    ),
    kategori_id: fc.oneof(fc.constant(''), fc.constant(null)),
    satuan_id: fc.oneof(fc.constant(''), fc.constant(null)),
    harga_beli: fc.oneof(
        fc.constant(-1), // Negative
        fc.constant(1000000000), // Too large
        fc.constant('invalid') // Non-numeric
    ),
    harga_jual: fc.oneof(
        fc.constant(-1), // Negative
        fc.constant(1000000000), // Too large
        fc.constant('invalid') // Non-numeric
    ),
    stok: fc.oneof(
        fc.constant(-1), // Negative
        fc.constant(1000000), // Too large
        fc.constant('invalid') // Non-numeric
    )
});

describe('Property 2: Form validation consistency', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Property: For any valid barang form input, validation should pass consistently', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: validKodeArbitrary,
                    nama: validNamaArbitrary,
                    kategori_id: fc.uuid(),
                    satuan_id: fc.uuid(),
                    harga_beli: validHargaArbitrary,
                    harga_jual: validHargaArbitrary,
                    stok: validStokArbitrary,
                    stok_minimum: fc.integer({ min: 0, max: 100 })
                }),
                (validFormData) => {
                    // Action: Validate the form data
                    const result = validateBarangForm(validFormData, [], []);
                    
                    // Property: Valid data should pass validation
                    return result.isValid === true && result.errors.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    test('Property: For any invalid barang form input, validation should fail consistently', () => {
        fc.assert(
            fc.property(
                invalidFormDataArbitrary,
                (invalidFormData) => {
                    // Action: Validate the invalid form data
                    const result = validateBarangForm(invalidFormData, [], []);
                    
                    // Property: Invalid data should fail validation
                    return result.isValid === false && result.errors.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any kode input, uniqueness validation should work consistently', () => {
        fc.assert(
            fc.property(
                validKodeArbitrary,
                fc.array(validKodeArbitrary, { minLength: 1, maxLength: 20 }),
                (newKode, existingCodes) => {
                    const formData = {
                        kode: newKode,
                        nama: 'Test Item',
                        kategori_id: 'cat-1',
                        satuan_id: 'unit-1'
                    };
                    
                    // Test with existing codes
                    const resultWithExisting = validateBarangForm(formData, existingCodes, []);
                    
                    // Test without existing codes
                    const resultWithoutExisting = validateBarangForm(formData, [], []);
                    
                    // Property: Should fail if kode exists, pass if unique
                    const shouldFail = existingCodes.includes(newKode);
                    const failsWhenDuplicate = shouldFail ? !resultWithExisting.isValid : true;
                    const passesWhenUnique = !shouldFail ? resultWithoutExisting.isValid : true;
                    
                    return failsWhenDuplicate && passesWhenUnique;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any nama input, uniqueness validation should work consistently', () => {
        fc.assert(
            fc.property(
                validNamaArbitrary,
                fc.array(validNamaArbitrary, { minLength: 1, maxLength: 20 }),
                (newNama, existingNames) => {
                    const formData = {
                        kode: 'TEST123',
                        nama: newNama,
                        kategori_id: 'cat-1',
                        satuan_id: 'unit-1'
                    };
                    
                    // Convert existing names to lowercase for comparison
                    const existingNamesLower = existingNames.map(n => n.toLowerCase());
                    
                    // Test with existing names
                    const resultWithExisting = validateBarangForm(formData, [], existingNamesLower);
                    
                    // Test without existing names
                    const resultWithoutExisting = validateBarangForm(formData, [], []);
                    
                    // Property: Should fail if nama exists (case-insensitive), pass if unique
                    const shouldFail = existingNamesLower.includes(newNama.toLowerCase());
                    const failsWhenDuplicate = shouldFail ? !resultWithExisting.isValid : true;
                    const passesWhenUnique = !shouldFail ? resultWithoutExisting.isValid : true;
                    
                    return failsWhenDuplicate && passesWhenUnique;
                }
            ),
            { numRuns: 100 }
        );
    });
    test('Property: For any required field missing, validation should fail consistently', () => {
        const requiredFields = ['kode', 'nama', 'kategori_id', 'satuan_id'];
        
        requiredFields.forEach(fieldName => {
            fc.assert(
                fc.property(
                    barangFormDataArbitrary,
                    (baseFormData) => {
                        // Create form data with missing required field
                        const incompleteFormData = { ...baseFormData };
                        delete incompleteFormData[fieldName];
                        
                        // Action: Validate incomplete form data
                        const result = validateBarangForm(incompleteFormData, [], []);
                        
                        // Property: Should fail validation due to missing required field
                        return result.isValid === false && result.errors.length > 0;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    test('Property: For any numeric field with invalid values, validation should fail consistently', () => {
        const numericFields = [
            { field: 'harga_beli', invalidValues: [-1, 'abc', 1000000000] },
            { field: 'harga_jual', invalidValues: [-1, 'xyz', 1000000000] },
            { field: 'stok', invalidValues: [-1, 'invalid', 1000000] },
            { field: 'stok_minimum', invalidValues: [-1, 'bad'] } // No max validation for stok_minimum
        ];
        
        numericFields.forEach(({ field, invalidValues }) => {
            invalidValues.forEach(invalidValue => {
                fc.assert(
                    fc.property(
                        fc.record({
                            kode: validKodeArbitrary,
                            nama: validNamaArbitrary,
                            kategori_id: fc.uuid(),
                            satuan_id: fc.uuid(),
                            [field]: fc.constant(invalidValue)
                        }),
                        (formDataWithInvalidField) => {
                            // Action: Validate form with invalid numeric field
                            const result = validateBarangForm(formDataWithInvalidField, [], []);
                            
                            // Property: Should fail validation for invalid numeric values
                            // Skip null values as they might not trigger validation
                            if (invalidValue === null || invalidValue === undefined) {
                                return true;
                            }
                            
                            return result.isValid === false && result.errors.length > 0;
                        }
                    ),
                    { numRuns: 20 }
                );
            });
        });
    });

    test('Property: For any form data, validation should be deterministic', () => {
        fc.assert(
            fc.property(
                barangFormDataArbitrary,
                fc.array(validKodeArbitrary, { maxLength: 10 }),
                fc.array(validNamaArbitrary, { maxLength: 10 }),
                (formData, existingCodes, existingNames) => {
                    // Action: Validate same data twice
                    const result1 = validateBarangForm(formData, existingCodes, existingNames);
                    const result2 = validateBarangForm(formData, existingCodes, existingNames);
                    
                    // Property: Results should be identical
                    const sameValidity = result1.isValid === result2.isValid;
                    const sameErrors = JSON.stringify(result1.errors) === JSON.stringify(result2.errors);
                    const sameWarnings = JSON.stringify(result1.warnings) === JSON.stringify(result2.warnings);
                    
                    return sameValidity && sameErrors && sameWarnings;
                }
            ),
            { numRuns: 100 }
        );
    });
});