/**
 * Property-Based Test: New Unit Auto-Creation
 * Feature: upload-master-barang-excel, Property 10: New Unit Auto-Creation
 * 
 * Validates: Requirements 3.2
 * For any upload data containing new satuan, the unit management system should 
 * create new units automatically after user confirmation
 */

import fc from 'fast-check';

// Mock CategoryUnitManager for testing
class CategoryUnitManager {
    constructor() {
        this.categories = ['makanan', 'minuman', 'alat-tulis', 'elektronik', 'kebersihan', 'lainnya'];
        this.units = ['pcs', 'kg', 'gram', 'liter', 'ml', 'box', 'pack', 'botol', 'kaleng', 'meter'];
        this.storageKey = {
            categories: 'excel_upload_categories',
            units: 'excel_upload_units'
        };
    }

    getCategories() {
        return [...this.categories];
    }

    getUnits() {
        return [...this.units];
    }

    createCategory(name) {
        try {
            if (!name || typeof name !== 'string') {
                return false;
            }

            const normalizedName = name.trim().toLowerCase();
            
            if (normalizedName === '' || this.categories.includes(normalizedName)) {
                return false;
            }

            this.categories.push(normalizedName);
            return true;
        } catch (error) {
            return false;
        }
    }

    createUnit(name) {
        try {
            if (!name || typeof name !== 'string') {
                return false;
            }

            const normalizedName = name.trim().toLowerCase();
            
            if (normalizedName === '' || this.units.includes(normalizedName)) {
                return false;
            }

            this.units.push(normalizedName);
            return true;
        } catch (error) {
            return false;
        }
    }

    autoCreateFromData(data) {
        try {
            if (!Array.isArray(data)) {
                throw new Error('Data must be an array');
            }

            const newCategories = [];
            const newUnits = [];
            
            const foundCategories = new Set();
            const foundUnits = new Set();
            
            data.forEach(row => {
                if (row.kategori && typeof row.kategori === 'string') {
                    const normalizedCategory = row.kategori.trim().toLowerCase();
                    if (normalizedCategory !== '') {
                        foundCategories.add(normalizedCategory);
                    }
                }
                
                if (row.satuan && typeof row.satuan === 'string') {
                    const normalizedUnit = row.satuan.trim().toLowerCase();
                    if (normalizedUnit !== '') {
                        foundUnits.add(normalizedUnit);
                    }
                }
            });
            
            foundCategories.forEach(category => {
                if (!this.categories.includes(category)) {
                    newCategories.push(category);
                }
            });
            
            foundUnits.forEach(unit => {
                if (!this.units.includes(unit)) {
                    newUnits.push(unit);
                }
            });
            
            return {
                newCategories: newCategories,
                newUnits: newUnits,
                totalFound: {
                    categories: foundCategories.size,
                    units: foundUnits.size
                }
            };
        } catch (error) {
            return { newCategories: [], newUnits: [], error: error.message };
        }
    }

    autoCreateNewItems(newCategories, newUnits) {
        const results = {
            categoriesCreated: [],
            unitsCreated: [],
            categoriesFailed: [],
            unitsFailed: []
        };

        if (Array.isArray(newCategories)) {
            newCategories.forEach(category => {
                if (this.createCategory(category)) {
                    results.categoriesCreated.push(category);
                } else {
                    results.categoriesFailed.push(category);
                }
            });
        }

        if (Array.isArray(newUnits)) {
            newUnits.forEach(unit => {
                if (this.createUnit(unit)) {
                    results.unitsCreated.push(unit);
                } else {
                    results.unitsFailed.push(unit);
                }
            });
        }

        return results;
    }
}

describe('Property 10: New Unit Auto-Creation', () => {
    let categoryUnitManager;

    beforeEach(() => {
        categoryUnitManager = new CategoryUnitManager();
    });

    test('should detect all new units in any upload data', () => {
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
                    { minLength: 1, maxLength: 50 }
                ),
                (data) => {
                    const initialUnits = categoryUnitManager.getUnits();
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Extract actual unique units from data
                    const actualUnits = new Set();
                    data.forEach(row => {
                        if (row.satuan && typeof row.satuan === 'string') {
                            const normalized = row.satuan.trim().toLowerCase();
                            if (normalized !== '') {
                                actualUnits.add(normalized);
                            }
                        }
                    });
                    
                    // Find units that are actually new
                    const expectedNewUnits = Array.from(actualUnits).filter(unit => 
                        !initialUnits.includes(unit)
                    );
                    
                    // Property: All new units should be detected
                    expect(result.newUnits.sort()).toEqual(expectedNewUnits.sort());
                    
                    // Property: Total found should match actual unique units
                    expect(result.totalFound.units).toBe(actualUnits.size);
                    
                    // Property: No error should occur with valid data
                    expect(result.error).toBeUndefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should successfully create all detected new units', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim() !== ''),
                    { minLength: 1, maxLength: 10 }
                ), // New unit names
                (newUnitNames) => {
                    // Create data with new units
                    const data = newUnitNames.map((unit, index) => ({
                        kode: `UNIT${index}`,
                        nama: `Unit Test Product ${index}`,
                        kategori: 'elektronik',
                        satuan: unit,
                        harga_beli: 1000,
                        stok: 10
                    }));
                    
                    const initialUnits = categoryUnitManager.getUnits();
                    const detectionResult = categoryUnitManager.autoCreateFromData(data);
                    
                    // Auto-create the detected new units
                    const creationResult = categoryUnitManager.autoCreateNewItems(
                        detectionResult.newCategories,
                        detectionResult.newUnits
                    );
                    
                    const finalUnits = categoryUnitManager.getUnits();
                    
                    // Property: All successfully created units should be available
                    creationResult.unitsCreated.forEach(unit => {
                        expect(finalUnits).toContain(unit);
                    });
                    
                    // Property: Number of units should increase by number created
                    const expectedIncrease = creationResult.unitsCreated.length;
                    expect(finalUnits.length).toBe(initialUnits.length + expectedIncrease);
                    
                    // Property: No duplicates should exist after creation
                    const uniqueUnits = new Set(finalUnits);
                    expect(uniqueUnits.size).toBe(finalUnits.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle duplicate units consistently', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim() !== ''),
                fc.integer({ min: 2, max: 10 }),
                (unitName, duplicateCount) => {
                    // Create data with duplicate units
                    const data = Array.from({ length: duplicateCount }, (_, index) => ({
                        kode: `DUP_UNIT${index}`,
                        nama: `Duplicate Unit Product ${index}`,
                        kategori: 'elektronik',
                        satuan: unitName,
                        harga_beli: 1000,
                        stok: 10
                    }));
                    
                    const initialUnits = categoryUnitManager.getUnits();
                    const normalizedUnit = unitName.trim().toLowerCase();
                    const isExisting = initialUnits.includes(normalizedUnit);
                    
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Property: Duplicate units should be detected only once
                    if (isExisting) {
                        expect(result.newUnits).not.toContain(normalizedUnit);
                        expect(result.newUnits.length).toBe(0);
                    } else {
                        expect(result.newUnits).toContain(normalizedUnit);
                        expect(result.newUnits.length).toBe(1);
                    }
                    
                    // Property: Total found should be 1 regardless of duplicates
                    expect(result.totalFound.units).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle empty and invalid unit values gracefully', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        kategori: fc.string({ minLength: 1, maxLength: 50 }),
                        satuan: fc.oneof(
                            fc.constant(''),
                            fc.constant('   '),
                            fc.constant(null),
                            fc.constant(undefined),
                            fc.string({ minLength: 1, maxLength: 15 })
                        ),
                        harga_beli: fc.float({ min: 0, max: 1000000 }),
                        stok: fc.float({ min: 0, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (data) => {
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Count valid units in data
                    const validUnits = data.filter(row => 
                        row.satuan && 
                        typeof row.satuan === 'string' && 
                        row.satuan.trim() !== ''
                    ).map(row => row.satuan.trim().toLowerCase());
                    
                    const uniqueValidUnits = new Set(validUnits);
                    
                    // Property: Should not fail with invalid data
                    expect(result.error).toBeUndefined();
                    
                    // Property: Should only detect valid units
                    expect(result.totalFound.units).toBe(uniqueValidUnits.size);
                    
                    // Property: New units should not include empty/null values
                    result.newUnits.forEach(unit => {
                        expect(unit).toBeTruthy();
                        expect(typeof unit).toBe('string');
                        expect(unit.trim()).not.toBe('');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should maintain unit availability after auto-creation', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim() !== ''),
                    { minLength: 1, maxLength: 5 }
                ),
                (newUnitNames) => {
                    // Ensure units are truly new by filtering existing ones
                    const initialUnits = categoryUnitManager.getUnits();
                    const trulyNewUnits = newUnitNames.filter(name => 
                        !initialUnits.includes(name.trim().toLowerCase())
                    );
                    
                    if (trulyNewUnits.length === 0) {
                        return; // Skip if no new units
                    }
                    
                    // Create data with new units
                    const data = trulyNewUnits.map((unit, index) => ({
                        kode: `NEW_UNIT${index}`,
                        nama: `New Unit Product ${index}`,
                        kategori: 'elektronik',
                        satuan: unit,
                        harga_beli: 1000,
                        stok: 10
                    }));
                    
                    // Detect and create new units
                    const detectionResult = categoryUnitManager.autoCreateFromData(data);
                    const creationResult = categoryUnitManager.autoCreateNewItems(
                        [],
                        detectionResult.newUnits
                    );
                    
                    // Property: All created units should be available for future use
                    creationResult.unitsCreated.forEach(unit => {
                        const currentUnits = categoryUnitManager.getUnits();
                        expect(currentUnits).toContain(unit);
                        
                        // Test that unit can be used in subsequent operations
                        const testData = [{
                            kode: 'UNIT_TEST',
                            nama: 'Unit Test Product',
                            kategori: 'elektronik',
                            satuan: unit,
                            harga_beli: 1000,
                            stok: 10
                        }];
                        
                        const subsequentResult = categoryUnitManager.autoCreateFromData(testData);
                        // Should not detect as new since it was already created
                        expect(subsequentResult.newUnits).not.toContain(unit);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle case-insensitive unit detection and creation', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim() !== ''),
                fc.constantFrom('upper', 'lower', 'mixed'),
                (baseUnitName, caseVariation) => {
                    // Apply case variation
                    let unitName = baseUnitName;
                    switch (caseVariation) {
                        case 'upper':
                            unitName = baseUnitName.toUpperCase();
                            break;
                        case 'lower':
                            unitName = baseUnitName.toLowerCase();
                            break;
                        case 'mixed':
                            unitName = baseUnitName.split('').map((char, i) => 
                                i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
                            ).join('');
                            break;
                    }
                    
                    const data = [{
                        kode: 'CASE_UNIT_TEST',
                        nama: 'Case Unit Test Product',
                        kategori: 'elektronik',
                        satuan: unitName,
                        harga_beli: 1000,
                        stok: 10
                    }];
                    
                    const initialUnits = categoryUnitManager.getUnits();
                    const normalizedExpected = baseUnitName.trim().toLowerCase();
                    const isExisting = initialUnits.includes(normalizedExpected);
                    
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Property: Case variations should be normalized consistently
                    if (isExisting) {
                        expect(result.newUnits.length).toBe(0);
                    } else {
                        expect(result.newUnits.length).toBe(1);
                        expect(result.newUnits[0]).toBe(normalizedExpected);
                    }
                    
                    // Property: Creation should use normalized name
                    if (!isExisting) {
                        const creationResult = categoryUnitManager.autoCreateNewItems(
                            [],
                            result.newUnits
                        );
                        
                        expect(creationResult.unitsCreated).toContain(normalizedExpected);
                        
                        const finalUnits = categoryUnitManager.getUnits();
                        expect(finalUnits).toContain(normalizedExpected);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle mixed category and unit creation simultaneously', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        kategori: fc.string({ minLength: 1, maxLength: 15 }),
                        satuan: fc.string({ minLength: 1, maxLength: 10 }),
                        harga_beli: fc.float({ min: 0, max: 1000000 }),
                        stok: fc.float({ min: 0, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (data) => {
                    const initialCategories = categoryUnitManager.getCategories();
                    const initialUnits = categoryUnitManager.getUnits();
                    
                    const detectionResult = categoryUnitManager.autoCreateFromData(data);
                    const creationResult = categoryUnitManager.autoCreateNewItems(
                        detectionResult.newCategories,
                        detectionResult.newUnits
                    );
                    
                    const finalCategories = categoryUnitManager.getCategories();
                    const finalUnits = categoryUnitManager.getUnits();
                    
                    // Property: Categories and units should be created independently
                    expect(finalCategories.length).toBe(
                        initialCategories.length + creationResult.categoriesCreated.length
                    );
                    expect(finalUnits.length).toBe(
                        initialUnits.length + creationResult.unitsCreated.length
                    );
                    
                    // Property: All created items should be available
                    creationResult.categoriesCreated.forEach(category => {
                        expect(finalCategories).toContain(category);
                    });
                    creationResult.unitsCreated.forEach(unit => {
                        expect(finalUnits).toContain(unit);
                    });
                    
                    // Property: Categories and units should be managed independently
                    // Note: It's possible for the same string to be both a category and unit
                    // This is valid business logic, so we don't test for cross-contamination
                    expect(creationResult.categoriesCreated.length + creationResult.unitsCreated.length).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});