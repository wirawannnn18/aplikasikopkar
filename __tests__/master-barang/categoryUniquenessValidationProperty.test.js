/**
 * Property Test 16: Category uniqueness validation
 * 
 * Property: For any new category creation, the system should validate name uniqueness 
 * and prevent duplicate categories
 * 
 * Validates: Requirements 5.2
 */

import fc from 'fast-check';
import { KategoriManager } from '../../js/master-barang/KategoriManager.js';

// Mock localStorage with unique storage per test
let testStorageCounter = 0;

function createMockLocalStorage() {
    const storageId = ++testStorageCounter;
    return {
        data: {},
        storageId,
        getItem: function(key) {
            return this.data[key] || null;
        },
        setItem: function(key, value) {
            this.data[key] = value;
        },
        clear: function() {
            this.data = {};
        }
    };
}

// Setup global localStorage mock
const mockLocalStorage = createMockLocalStorage();
global.localStorage = mockLocalStorage;

// Helper function to clear manager data
function clearManagerData(manager) {
    mockLocalStorage.clear();
    manager.data = manager.loadData(); // Force reload from cleared storage
}

// Helper function to create fresh manager
function createFreshManager() {
    mockLocalStorage.clear();
    const manager = new KategoriManager();
    manager.data = manager.loadData(); // Force reload from cleared storage
    return manager;
}

describe('Property Test 16: Category uniqueness validation', () => {
    let kategoriManager;
    
    beforeEach(() => {
        // Create fresh manager for each test
        mockLocalStorage.clear();
        kategoriManager = new KategoriManager();
        kategoriManager.data = [];
    });
    
    // Helper function to create a completely isolated test environment
    function createIsolatedManager() {
        // Create a unique localStorage mock for this test
        const testStorage = {
            data: {},
            getItem: function(key) {
                return this.data[key] || null;
            },
            setItem: function(key, value) {
                this.data[key] = value;
            },
            clear: function() {
                this.data = {};
            }
        };
        
        // Temporarily replace global localStorage
        const originalLocalStorage = global.localStorage;
        global.localStorage = testStorage;
        
        // Create fresh manager
        const manager = new KategoriManager();
        manager.data = [];
        
        // Return manager and cleanup function
        return {
            manager,
            cleanup: () => {
                global.localStorage = originalLocalStorage;
            }
        };
    }

    describe('Basic functionality test', () => {
        test('should create a simple category successfully', () => {
            const { manager, cleanup } = createIsolatedManager();
            
            const result = manager.createKategori({
                nama: "Test Category",
                deskripsi: "Test description"
            });
            
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.nama).toBe("Test Category");
            
            cleanup();
        });

        test('should prevent duplicate category names', () => {
            const { manager, cleanup } = createIsolatedManager();
            
            // Create first category
            const firstResult = manager.createKategori({
                nama: "Test Category",
                deskripsi: "First description"
            });
            
            expect(firstResult.success).toBe(true);
            
            // Attempt to create duplicate
            const duplicateResult = manager.createKategori({
                nama: "Test Category",
                deskripsi: "Duplicate description"
            });
            
            expect(duplicateResult.success).toBe(false);
            expect(duplicateResult.errors[0]).toContain('sudah ada');
            
            cleanup();
        });

        test('should handle numeric category names', () => {
            const { manager, cleanup } = createIsolatedManager();
            
            const result = manager.createKategori({
                nama: "123",
                deskripsi: "Numeric category"
            });
            
            expect(result.success).toBe(true);
            expect(result.data.nama).toBe("123");
            
            cleanup();
        });

        test('should handle short alphanumeric names', () => {
            const { manager, cleanup } = createIsolatedManager();
            
            const result = manager.createKategori({
                nama: "A1",
                deskripsi: "Short alphanumeric"
            });
            
            expect(result.success).toBe(true);
            expect(result.data.nama).toBe("A1");
            
            cleanup();
        });
    });

    describe('Category name uniqueness validation with property testing', () => {
        test('should prevent creation of categories with duplicate names (case insensitive)', () => {
            fc.assert(fc.property(
                fc.constantFrom("Electronics", "Food", "Clothing", "Books", "Toys", "Sports", "Music", "Games"),
                fc.string({ minLength: 0, maxLength: 200 }),
                (categoryName, description) => {
                    // Use the manager from beforeEach, but clear it first
                    clearManagerData(kategoriManager);
                    
                    // Create first category
                    const firstResult = kategoriManager.createKategori({
                        nama: categoryName,
                        deskripsi: description
                    });
                    
                    // First creation should succeed
                    expect(firstResult.success).toBe(true);
                    expect(firstResult.data).toBeDefined();
                    expect(firstResult.data.nama).toBe(categoryName);
                    
                    // Attempt to create duplicate with same name (exact match)
                    const duplicateResult = kategoriManager.createKategori({
                        nama: categoryName,
                        deskripsi: 'Different description'
                    });
                    
                    // Duplicate creation should fail
                    expect(duplicateResult.success).toBe(false);
                    expect(duplicateResult.errors[0]).toContain('sudah ada');
                    
                    // Attempt to create duplicate with different case
                    const caseVariantResult = kategoriManager.createKategori({
                        nama: categoryName.toUpperCase(),
                        deskripsi: 'Case variant'
                    });
                    
                    // Case variant should also fail (case insensitive check)
                    expect(caseVariantResult.success).toBe(false);
                    expect(caseVariantResult.errors[0]).toContain('sudah ada');
                }
            ), { numRuns: 8 });
        });

        test('should allow creation of categories with different names', () => {
            fc.assert(fc.property(
                fc.shuffledSubarray(["Electronics", "Food", "Clothing", "Books", "Toys", "Sports", "Music", "Games"], { minLength: 2, maxLength: 4 }),
                (categoryNames) => {
                    // Use the manager from beforeEach, but clear it first
                    clearManagerData(kategoriManager);
                    
                    const results = [];
                    
                    // Create categories with unique names
                    for (const name of categoryNames) {
                        const result = kategoriManager.createKategori({
                            nama: name,
                            deskripsi: `Description for ${name}`
                        });
                        results.push(result);
                    }
                    
                    // All creations should succeed
                    results.forEach(result => {
                        expect(result.success).toBe(true);
                        expect(result.data).toBeDefined();
                    });
                    
                    // Verify all categories are stored
                    const allCategories = kategoriManager.getAll();
                    expect(allCategories.length).toBe(results.length);
                    
                    // Verify names are unique in storage
                    const storedNames = allCategories.map(cat => cat.nama.toLowerCase());
                    const uniqueStoredNames = [...new Set(storedNames)];
                    expect(storedNames.length).toBe(uniqueStoredNames.length);
                }
            ), { numRuns: 10 });
        });

        test('should handle whitespace normalization in uniqueness check', () => {
            fc.assert(fc.property(
                fc.constantFrom("Electronics", "Food", "Clothing", "Books"),
                fc.nat({ max: 3 }),
                fc.nat({ max: 3 }),
                (baseName, leadingSpaces, trailingSpaces) => {
                    // Use the manager from beforeEach, but clear it first
                    clearManagerData(kategoriManager);
                    
                    const nameWithSpaces = ' '.repeat(leadingSpaces) + baseName + ' '.repeat(trailingSpaces);
                    
                    // Create category with base name
                    const firstResult = kategoriManager.createKategori({
                        nama: baseName,
                        deskripsi: 'First category'
                    });
                    
                    expect(firstResult.success).toBe(true);
                    
                    // Attempt to create with extra whitespace
                    const spacedResult = kategoriManager.createKategori({
                        nama: nameWithSpaces,
                        deskripsi: 'Spaced category'
                    });
                    
                    // Should fail due to uniqueness (after trimming)
                    expect(spacedResult.success).toBe(false);
                    expect(spacedResult.errors[0]).toContain('sudah ada');
                }
            ), { numRuns: 8 });
        });
    });

    describe('Category update uniqueness validation', () => {
        test('should prevent updating category to duplicate name', () => {
            fc.assert(fc.property(
                fc.constantFrom("Electronics", "Food", "Clothing", "Books"),
                fc.constantFrom("Toys", "Sports", "Music", "Games"),
                (firstName, secondName) => {
                    // Use the manager from beforeEach, but clear it first
                    clearManagerData(kategoriManager);
                    
                    // Skip if names are the same
                    if (firstName.toLowerCase() === secondName.toLowerCase()) return;
                    
                    // Create two categories
                    const firstResult = kategoriManager.createKategori({
                        nama: firstName,
                        deskripsi: 'First category'
                    });
                    
                    const secondResult = kategoriManager.createKategori({
                        nama: secondName,
                        deskripsi: 'Second category'
                    });
                    
                    expect(firstResult.success).toBe(true);
                    expect(secondResult.success).toBe(true);
                    
                    // Attempt to update second category to have same name as first
                    const updateResult = kategoriManager.updateKategori(secondResult.data.id, {
                        nama: firstName
                    });
                    
                    // Update should fail due to uniqueness
                    expect(updateResult.success).toBe(false);
                    expect(updateResult.errors[0]).toContain('sudah ada');
                    
                    // Verify original data is unchanged
                    const unchangedCategory = kategoriManager.findById(secondResult.data.id);
                    expect(unchangedCategory.nama).toBe(secondName);
                }
            ), { numRuns: 8 });
        });

        test('should allow updating category with same name (no change)', () => {
            fc.assert(fc.property(
                fc.constantFrom("Electronics", "Food", "Clothing", "Books"),
                fc.string({ minLength: 0, maxLength: 200 }),
                (categoryName, newDescription) => {
                    // Use the manager from beforeEach, but clear it first
                    clearManagerData(kategoriManager);
                    
                    // Create category
                    const createResult = kategoriManager.createKategori({
                        nama: categoryName,
                        deskripsi: 'Original description'
                    });
                    
                    expect(createResult.success).toBe(true);
                    
                    // Update with same name but different description
                    const updateResult = kategoriManager.updateKategori(createResult.data.id, {
                        nama: categoryName,
                        deskripsi: newDescription
                    });
                    
                    // Update should succeed
                    expect(updateResult.success).toBe(true);
                    expect(updateResult.data.nama).toBe(categoryName);
                    expect(updateResult.data.deskripsi).toBe(newDescription);
                }
            ), { numRuns: 8 });
        });
    });

    describe('Edge cases and validation consistency', () => {
        test('should handle empty and invalid names consistently', () => {
            const invalidNames = ['', '   ', '\t\n', 'A', 'A'.repeat(51)];
            
            invalidNames.forEach(invalidName => {
                // Clear data for each test
                clearManagerData(kategoriManager);
                
                const result = kategoriManager.createKategori({
                    nama: invalidName,
                    deskripsi: 'Test description'
                });
                
                // Should fail validation
                expect(result.success).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
                
                // Should not create any category
                const allCategories = kategoriManager.getAll();
                expect(allCategories.length).toBe(0);
            });
        });

        test('should maintain uniqueness across multiple operations', () => {
            clearManagerData(kategoriManager);
            
            const categoryNames = ["Electronics", "Food", "Clothing"];
            const createdIds = [];
            
            // Create categories
            for (const name of categoryNames) {
                const result = kategoriManager.createKategori({
                    nama: name,
                    deskripsi: `Category ${name}`
                });
                
                expect(result.success).toBe(true);
                createdIds.push(result.data.id);
            }
            
            // Try to create duplicates
            for (const name of categoryNames) {
                const duplicateResult = kategoriManager.createKategori({
                    nama: name,
                    deskripsi: 'Duplicate attempt'
                });
                
                expect(duplicateResult.success).toBe(false);
                expect(duplicateResult.errors[0]).toContain('sudah ada');
            }
            
            // Verify total count hasn't changed
            const finalCategories = kategoriManager.getAll();
            expect(finalCategories.length).toBe(createdIds.length);
            
            // Verify all names are still unique
            const finalNames = finalCategories.map(cat => cat.nama.toLowerCase());
            const uniqueFinalNames = [...new Set(finalNames)];
            expect(finalNames.length).toBe(uniqueFinalNames.length);
        });
    });

    describe('Integration with search and retrieval', () => {
        test('should maintain uniqueness when retrieving by name', () => {
            clearManagerData(kategoriManager);
            
            const categoryName = "Electronics";
            
            // Create category
            const createResult = kategoriManager.createKategori({
                nama: categoryName,
                deskripsi: 'Test category'
            });
            
            expect(createResult.success).toBe(true);
            
            // Retrieve by name
            const retrieved = kategoriManager.getByNama(categoryName);
            expect(retrieved).toBeDefined();
            expect(retrieved.nama).toBe(categoryName);
            
            // Retrieve by different case
            const retrievedUpperCase = kategoriManager.getByNama(categoryName.toUpperCase());
            expect(retrievedUpperCase).toBeDefined();
            expect(retrievedUpperCase.id).toBe(retrieved.id);
            
            // Attempt to create duplicate should still fail
            const duplicateResult = kategoriManager.createKategori({
                nama: categoryName.toUpperCase(),
                deskripsi: 'Uppercase duplicate'
            });
            
            expect(duplicateResult.success).toBe(false);
            expect(duplicateResult.errors[0]).toContain('sudah ada');
        });
    });

    describe('Bulk operations uniqueness validation', () => {
        test('should maintain uniqueness during bulk status updates', () => {
            clearManagerData(kategoriManager);
            
            const categoryNames = ["Electronics", "Food"];
            const createdIds = [];
            
            // Create categories
            for (const name of categoryNames) {
                const result = kategoriManager.createKategori({
                    nama: name,
                    deskripsi: `Category ${name}`
                });
                
                expect(result.success).toBe(true);
                createdIds.push(result.data.id);
            }
            
            // Bulk update status
            const bulkResult = kategoriManager.bulkUpdateStatus(createdIds, 'nonaktif');
            expect(bulkResult.success).toBe(createdIds.length);
            expect(bulkResult.failed).toBe(0);
            
            // Verify names are still unique after bulk update
            const allCategories = kategoriManager.getAll();
            const names = allCategories.map(cat => cat.nama.toLowerCase());
            const uniqueStoredNames = [...new Set(names)];
            expect(names.length).toBe(uniqueStoredNames.length);
            
            // All should be inactive now
            allCategories.forEach(cat => {
                expect(cat.status).toBe('nonaktif');
            });
        });
    });
});