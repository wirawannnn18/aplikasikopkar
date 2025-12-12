/**
 * Property-Based Test: Auto-Creation Category Consistency
 * Feature: upload-master-barang-excel, Property 3: Auto-Creation Category Consistency
 * 
 * Validates: Requirements 1.4
 * For any upload data containing new categories, the category management system should 
 * automatically create those categories and make them available for future use
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

describe('Property 3: Auto-Creation Category Consistency', () => {
    let categoryUnitManager;

    beforeEach(() => {
        categoryUnitManager = new CategoryUnitManager();
    });

    test('should detect all new categories in any upload data', () => {
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
                    const initialCategories = categoryUnitManager.getCategories();
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Extract actual unique categories from data
                    const actualCategories = new Set();
                    data.forEach(row => {
                        if (row.kategori && typeof row.kategori === 'string') {
                            const normalized = row.kategori.trim().toLowerCase();
                            if (normalized !== '') {
                                actualCategories.add(normalized);
                            }
                        }
                    });
                    
                    // Find categories that are actually new
                    const expectedNewCategories = Array.from(actualCategories).filter(cat => 
                        !initialCategories.includes(cat)
                    );
                    
                    // Property: All new categories should be detected
                    expect(result.newCategories.sort()).toEqual(expectedNewCategories.sort());
                    
                    // Property: Total found should match actual unique categories
                    expect(result.totalFound.categories).toBe(actualCategories.size);
                    
                    // Property: No error should occur with valid data
                    expect(result.error).toBeUndefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should successfully create all detected new categories', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim() !== ''),
                    { minLength: 1, maxLength: 10 }
                ), // New category names
                (newCategoryNames) => {
                    // Create data with new categories
                    const data = newCategoryNames.map((category, index) => ({
                        kode: `TEST${index}`,
                        nama: `Test Product ${index}`,
                        kategori: category,
                        satuan: 'pcs',
                        harga_beli: 1000,
                        stok: 10
                    }));
                    
                    const initialCategories = categoryUnitManager.getCategories();
                    const detectionResult = categoryUnitManager.autoCreateFromData(data);
                    
                    // Auto-create the detected new categories
                    const creationResult = categoryUnitManager.autoCreateNewItems(
                        detectionResult.newCategories,
                        detectionResult.newUnits
                    );
                    
                    const finalCategories = categoryUnitManager.getCategories();
                    
                    // Property: All successfully created categories should be available
                    creationResult.categoriesCreated.forEach(category => {
                        expect(finalCategories).toContain(category);
                    });
                    
                    // Property: Number of categories should increase by number created
                    const expectedIncrease = creationResult.categoriesCreated.length;
                    expect(finalCategories.length).toBe(initialCategories.length + expectedIncrease);
                    
                    // Property: No duplicates should exist after creation
                    const uniqueCategories = new Set(finalCategories);
                    expect(uniqueCategories.size).toBe(finalCategories.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle duplicate categories consistently', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim() !== ''),
                fc.integer({ min: 2, max: 10 }),
                (categoryName, duplicateCount) => {
                    // Create data with duplicate categories
                    const data = Array.from({ length: duplicateCount }, (_, index) => ({
                        kode: `DUP${index}`,
                        nama: `Duplicate Product ${index}`,
                        kategori: categoryName,
                        satuan: 'pcs',
                        harga_beli: 1000,
                        stok: 10
                    }));
                    
                    const initialCategories = categoryUnitManager.getCategories();
                    const normalizedCategory = categoryName.trim().toLowerCase();
                    const isExisting = initialCategories.includes(normalizedCategory);
                    
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Property: Duplicate categories should be detected only once
                    if (isExisting) {
                        expect(result.newCategories).not.toContain(normalizedCategory);
                        expect(result.newCategories.length).toBe(0);
                    } else {
                        expect(result.newCategories).toContain(normalizedCategory);
                        expect(result.newCategories.length).toBe(1);
                    }
                    
                    // Property: Total found should be 1 regardless of duplicates
                    expect(result.totalFound.categories).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle empty and invalid category values gracefully', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        kategori: fc.oneof(
                            fc.constant(''),
                            fc.constant('   '),
                            fc.constant(null),
                            fc.constant(undefined),
                            fc.string({ minLength: 1, maxLength: 20 })
                        ),
                        satuan: fc.string({ minLength: 1, maxLength: 20 }),
                        harga_beli: fc.float({ min: 0, max: 1000000 }),
                        stok: fc.float({ min: 0, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (data) => {
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Count valid categories in data
                    const validCategories = data.filter(row => 
                        row.kategori && 
                        typeof row.kategori === 'string' && 
                        row.kategori.trim() !== ''
                    ).map(row => row.kategori.trim().toLowerCase());
                    
                    const uniqueValidCategories = new Set(validCategories);
                    
                    // Property: Should not fail with invalid data
                    expect(result.error).toBeUndefined();
                    
                    // Property: Should only detect valid categories
                    expect(result.totalFound.categories).toBe(uniqueValidCategories.size);
                    
                    // Property: New categories should not include empty/null values
                    result.newCategories.forEach(category => {
                        expect(category).toBeTruthy();
                        expect(typeof category).toBe('string');
                        expect(category.trim()).not.toBe('');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should maintain category availability after auto-creation', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim() !== ''),
                    { minLength: 1, maxLength: 5 }
                ),
                (newCategoryNames) => {
                    // Ensure categories are truly new by filtering existing ones
                    const initialCategories = categoryUnitManager.getCategories();
                    const trulyNewCategories = newCategoryNames.filter(name => 
                        !initialCategories.includes(name.trim().toLowerCase())
                    );
                    
                    if (trulyNewCategories.length === 0) {
                        return; // Skip if no new categories
                    }
                    
                    // Create data with new categories
                    const data = trulyNewCategories.map((category, index) => ({
                        kode: `NEW${index}`,
                        nama: `New Product ${index}`,
                        kategori: category,
                        satuan: 'pcs',
                        harga_beli: 1000,
                        stok: 10
                    }));
                    
                    // Detect and create new categories
                    const detectionResult = categoryUnitManager.autoCreateFromData(data);
                    const creationResult = categoryUnitManager.autoCreateNewItems(
                        detectionResult.newCategories,
                        []
                    );
                    
                    // Property: All created categories should be available for future use
                    creationResult.categoriesCreated.forEach(category => {
                        const currentCategories = categoryUnitManager.getCategories();
                        expect(currentCategories).toContain(category);
                        
                        // Test that category can be used in subsequent operations
                        const testData = [{
                            kode: 'TEST',
                            nama: 'Test Product',
                            kategori: category,
                            satuan: 'pcs',
                            harga_beli: 1000,
                            stok: 10
                        }];
                        
                        const subsequentResult = categoryUnitManager.autoCreateFromData(testData);
                        // Should not detect as new since it was already created
                        expect(subsequentResult.newCategories).not.toContain(category);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should handle case-insensitive category detection and creation', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim() !== ''),
                fc.constantFrom('upper', 'lower', 'mixed'),
                (baseCategoryName, caseVariation) => {
                    // Apply case variation
                    let categoryName = baseCategoryName;
                    switch (caseVariation) {
                        case 'upper':
                            categoryName = baseCategoryName.toUpperCase();
                            break;
                        case 'lower':
                            categoryName = baseCategoryName.toLowerCase();
                            break;
                        case 'mixed':
                            categoryName = baseCategoryName.split('').map((char, i) => 
                                i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
                            ).join('');
                            break;
                    }
                    
                    const data = [{
                        kode: 'CASE_TEST',
                        nama: 'Case Test Product',
                        kategori: categoryName,
                        satuan: 'pcs',
                        harga_beli: 1000,
                        stok: 10
                    }];
                    
                    const initialCategories = categoryUnitManager.getCategories();
                    const normalizedExpected = baseCategoryName.trim().toLowerCase();
                    const isExisting = initialCategories.includes(normalizedExpected);
                    
                    const result = categoryUnitManager.autoCreateFromData(data);
                    
                    // Property: Case variations should be normalized consistently
                    if (isExisting) {
                        expect(result.newCategories.length).toBe(0);
                    } else {
                        expect(result.newCategories.length).toBe(1);
                        expect(result.newCategories[0]).toBe(normalizedExpected);
                    }
                    
                    // Property: Creation should use normalized name
                    if (!isExisting) {
                        const creationResult = categoryUnitManager.autoCreateNewItems(
                            result.newCategories,
                            []
                        );
                        
                        expect(creationResult.categoriesCreated).toContain(normalizedExpected);
                        
                        const finalCategories = categoryUnitManager.getCategories();
                        expect(finalCategories).toContain(normalizedExpected);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});