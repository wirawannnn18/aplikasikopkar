/**
 * Property Test 17: Category dependency validation
 * 
 * Property: For any category deletion attempt, the system should validate that no barang items 
 * are using that category and prevent deletion if dependencies exist
 * 
 * Validates: Requirements 5.3
 */

import fc from 'fast-check';
import { KategoriManager } from '../../js/master-barang/KategoriManager.js';
import { BarangManager } from '../../js/master-barang/BarangManager.js';

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

// Helper function to create isolated test environment
function createIsolatedManagers() {
    // Create unique localStorage mock for this test
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
    
    // Create fresh managers
    const kategoriManager = new KategoriManager();
    const barangManager = new BarangManager();
    
    // Set up dependency injection
    kategoriManager.setBarangManager(barangManager);
    
    // Initialize with empty data
    kategoriManager.data = [];
    barangManager.data = [];
    
    // Return managers and cleanup function
    return {
        kategoriManager,
        barangManager,
        cleanup: () => {
            global.localStorage = originalLocalStorage;
        }
    };
}

describe('Property Test 17: Category dependency validation', () => {
    
    describe('Basic dependency validation functionality', () => {
        test('should allow deletion of category with no dependencies', () => {
            const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create a category
            const categoryResult = kategoriManager.createKategori({
                nama: "Test Category",
                deskripsi: "Test description"
            });
            
            expect(categoryResult.success).toBe(true);
            const categoryId = categoryResult.data.id;
            
            // Verify no barang items use this category
            const barangUsingCategory = barangManager.getByKategori(categoryId);
            expect(barangUsingCategory.length).toBe(0);
            
            // Delete should succeed
            const deleteResult = kategoriManager.deleteKategori(categoryId);
            expect(deleteResult.success).toBe(true);
            expect(deleteResult.errors.length).toBe(0);
            
            // Verify category is deleted
            const deletedCategory = kategoriManager.findById(categoryId);
            expect(deletedCategory).toBeNull();
            
            cleanup();
        });

        test('should prevent deletion of category with dependencies', () => {
            const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create a category
            const categoryResult = kategoriManager.createKategori({
                nama: "Electronics",
                deskripsi: "Electronic items"
            });
            
            expect(categoryResult.success).toBe(true);
            const categoryId = categoryResult.data.id;
            
            // Create a barang item using this category
            const barangResult = barangManager.createBarang({
                kode: "ELC001",
                nama: "Test Item",
                kategori_id: categoryId,
                kategori_nama: "Electronics",
                satuan_id: "unit1",
                satuan_nama: "PCS",
                harga_beli: 10000,
                harga_jual: 15000,
                stok: 10,
                stok_minimum: 5
            });
            
            expect(barangResult.success).toBe(true);
            
            // Verify barang uses this category
            const barangUsingCategory = barangManager.getByKategori(categoryId);
            expect(barangUsingCategory.length).toBe(1);
            
            // Delete should fail due to dependency
            const deleteResult = kategoriManager.deleteKategori(categoryId);
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.errors.length).toBeGreaterThan(0);
            expect(deleteResult.errors[0]).toContain('digunakan');
            
            // Verify category still exists
            const existingCategory = kategoriManager.findById(categoryId);
            expect(existingCategory).not.toBeNull();
            expect(existingCategory.nama).toBe("Electronics");
            
            cleanup();
        });

        test('should provide detailed dependency information', () => {
            const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create a category
            const categoryResult = kategoriManager.createKategori({
                nama: "Food",
                deskripsi: "Food items"
            });
            
            expect(categoryResult.success).toBe(true);
            const categoryId = categoryResult.data.id;
            
            // Create multiple barang items using this category
            const barangItems = [
                { kode: "FOOD001", nama: "Rice" },
                { kode: "FOOD002", nama: "Sugar" },
                { kode: "FOOD003", nama: "Salt" }
            ];
            
            for (const item of barangItems) {
                const result = barangManager.createBarang({
                    kode: item.kode,
                    nama: item.nama,
                    kategori_id: categoryId,
                    kategori_nama: "Food",
                    satuan_id: "unit1",
                    satuan_nama: "KG",
                    harga_beli: 5000,
                    harga_jual: 7000,
                    stok: 20,
                    stok_minimum: 5
                });
                expect(result.success).toBe(true);
            }
            
            // Delete should fail with detailed information
            const deleteResult = kategoriManager.deleteKategori(categoryId);
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.details).toBeDefined();
            expect(deleteResult.details.barang_count).toBe(3);
            expect(deleteResult.details.barang_list).toHaveLength(3);
            
            // Verify barang list contains expected items
            const barangList = deleteResult.details.barang_list;
            const kodelist = barangList.map(b => b.kode);
            expect(kodelist).toContain("FOOD001");
            expect(kodelist).toContain("FOOD002");
            expect(kodelist).toContain("FOOD003");
            
            cleanup();
        });
    });

    describe('Property-based dependency validation tests', () => {
        test('should consistently prevent deletion when dependencies exist', () => {
            fc.assert(fc.property(
                fc.constantFrom("Electronics", "Food", "Clothing", "Books", "Toys"),
                fc.array(fc.record({
                    kode: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
                    nama: fc.string({ minLength: 3, maxLength: 30 })
                }), { minLength: 1, maxLength: 5 }),
                (categoryName, barangItems) => {
                    const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Create category
                        const categoryResult = kategoriManager.createKategori({
                            nama: categoryName,
                            deskripsi: `Category for ${categoryName}`
                        });
                        
                        expect(categoryResult.success).toBe(true);
                        const categoryId = categoryResult.data.id;
                        
                        // Create barang items using this category
                        const createdBarang = [];
                        for (const item of barangItems) {
                            const barangResult = barangManager.createBarang({
                                kode: item.kode,
                                nama: item.nama,
                                kategori_id: categoryId,
                                kategori_nama: categoryName,
                                satuan_id: "unit1",
                                satuan_nama: "PCS",
                                harga_beli: 10000,
                                harga_jual: 15000,
                                stok: 10,
                                stok_minimum: 5
                            });
                            
                            if (barangResult.success) {
                                createdBarang.push(barangResult.data);
                            }
                        }
                        
                        // If any barang was created, deletion should fail
                        if (createdBarang.length > 0) {
                            const deleteResult = kategoriManager.deleteKategori(categoryId);
                            expect(deleteResult.success).toBe(false);
                            expect(deleteResult.errors.length).toBeGreaterThan(0);
                            expect(deleteResult.details).toBeDefined();
                            expect(deleteResult.details.barang_count).toBe(createdBarang.length);
                            
                            // Category should still exist
                            const existingCategory = kategoriManager.findById(categoryId);
                            expect(existingCategory).not.toBeNull();
                        }
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 10 });
        });

        test('should allow deletion after removing all dependencies', () => {
            fc.assert(fc.property(
                fc.constantFrom("Sports", "Music", "Games", "Tools"),
                fc.array(fc.string({ minLength: 3, maxLength: 8 }), { minLength: 1, maxLength: 3 }),
                (categoryName, barangCodes) => {
                    const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Create category
                        const categoryResult = kategoriManager.createKategori({
                            nama: categoryName,
                            deskripsi: `Category for ${categoryName}`
                        });
                        
                        expect(categoryResult.success).toBe(true);
                        const categoryId = categoryResult.data.id;
                        
                        // Create barang items using this category
                        const createdBarangIds = [];
                        for (const kode of barangCodes) {
                            const barangResult = barangManager.createBarang({
                                kode: kode.toUpperCase(),
                                nama: `Item ${kode}`,
                                kategori_id: categoryId,
                                kategori_nama: categoryName,
                                satuan_id: "unit1",
                                satuan_nama: "PCS",
                                harga_beli: 5000,
                                harga_jual: 8000,
                                stok: 15,
                                stok_minimum: 3
                            });
                            
                            if (barangResult.success) {
                                createdBarangIds.push(barangResult.data.id);
                            }
                        }
                        
                        // Verify deletion fails while dependencies exist
                        if (createdBarangIds.length > 0) {
                            const deleteResult1 = kategoriManager.deleteKategori(categoryId);
                            expect(deleteResult1.success).toBe(false);
                            
                            // Remove all barang dependencies
                            for (const barangId of createdBarangIds) {
                                const deleteBarangResult = barangManager.delete(barangId);
                                expect(deleteBarangResult).toBe(true);
                            }
                            
                            // Verify no dependencies remain
                            const remainingBarang = barangManager.getByKategori(categoryId);
                            expect(remainingBarang.length).toBe(0);
                            
                            // Now deletion should succeed
                            const deleteResult2 = kategoriManager.deleteKategori(categoryId);
                            expect(deleteResult2.success).toBe(true);
                            expect(deleteResult2.errors.length).toBe(0);
                            
                            // Verify category is deleted
                            const deletedCategory = kategoriManager.findById(categoryId);
                            expect(deletedCategory).toBeNull();
                        }
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 8 });
        });

        test('should handle concurrent dependency checks correctly', () => {
            fc.assert(fc.property(
                fc.constantFrom("Hardware", "Software", "Accessories"),
                fc.integer({ min: 1, max: 4 }),
                (categoryName, barangCount) => {
                    const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Create category
                        const categoryResult = kategoriManager.createKategori({
                            nama: categoryName,
                            deskripsi: `Category for ${categoryName}`
                        });
                        
                        expect(categoryResult.success).toBe(true);
                        const categoryId = categoryResult.data.id;
                        
                        // Create multiple barang items
                        for (let i = 0; i < barangCount; i++) {
                            const barangResult = barangManager.createBarang({
                                kode: `${categoryName.substring(0, 3).toUpperCase()}${String(i + 1).padStart(3, '0')}`,
                                nama: `${categoryName} Item ${i + 1}`,
                                kategori_id: categoryId,
                                kategori_nama: categoryName,
                                satuan_id: "unit1",
                                satuan_nama: "PCS",
                                harga_beli: 10000 + (i * 1000),
                                harga_jual: 15000 + (i * 1500),
                                stok: 10 + i,
                                stok_minimum: 2 + i
                            });
                            
                            expect(barangResult.success).toBe(true);
                        }
                        
                        // Multiple deletion attempts should all fail consistently
                        for (let attempt = 0; attempt < 3; attempt++) {
                            const deleteResult = kategoriManager.deleteKategori(categoryId);
                            expect(deleteResult.success).toBe(false);
                            expect(deleteResult.details.barang_count).toBe(barangCount);
                            
                            // Category should still exist after each attempt
                            const existingCategory = kategoriManager.findById(categoryId);
                            expect(existingCategory).not.toBeNull();
                            expect(existingCategory.nama).toBe(categoryName);
                        }
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 8 });
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle deletion of non-existent category', () => {
            const { kategoriManager, cleanup } = createIsolatedManagers();
            
            const nonExistentId = "non-existent-id";
            const deleteResult = kategoriManager.deleteKategori(nonExistentId);
            
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.errors.length).toBeGreaterThan(0);
            expect(deleteResult.errors[0]).toContain('tidak ditemukan');
            
            cleanup();
        });

        test('should handle barang manager not being set', () => {
            const { kategoriManager, cleanup } = createIsolatedManagers();
            
            // Remove barang manager reference
            kategoriManager.barangManager = null;
            
            // Create category
            const categoryResult = kategoriManager.createKategori({
                nama: "Test Category",
                deskripsi: "Test description"
            });
            
            expect(categoryResult.success).toBe(true);
            const categoryId = categoryResult.data.id;
            
            // Delete should succeed (no dependency check possible)
            const deleteResult = kategoriManager.deleteKategori(categoryId);
            expect(deleteResult.success).toBe(true);
            
            cleanup();
        });

        test('should maintain data integrity during failed deletion attempts', () => {
            const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create category
            const categoryResult = kategoriManager.createKategori({
                nama: "Integrity Test",
                deskripsi: "Testing data integrity"
            });
            
            expect(categoryResult.success).toBe(true);
            const categoryId = categoryResult.data.id;
            
            // Create barang using this category
            const barangResult = barangManager.createBarang({
                kode: "INT001",
                nama: "Integrity Item",
                kategori_id: categoryId,
                kategori_nama: "Integrity Test",
                satuan_id: "unit1",
                satuan_nama: "PCS",
                harga_beli: 12000,
                harga_jual: 18000,
                stok: 8,
                stok_minimum: 2
            });
            
            expect(barangResult.success).toBe(true);
            const barangId = barangResult.data.id;
            
            // Multiple failed deletion attempts
            for (let i = 0; i < 5; i++) {
                const deleteResult = kategoriManager.deleteKategori(categoryId);
                expect(deleteResult.success).toBe(false);
            }
            
            // Verify category data is unchanged
            const category = kategoriManager.findById(categoryId);
            expect(category).not.toBeNull();
            expect(category.nama).toBe("Integrity Test");
            expect(category.deskripsi).toBe("Testing data integrity");
            
            // Verify barang data is unchanged
            const barang = barangManager.findById(barangId);
            expect(barang).not.toBeNull();
            expect(barang.kode).toBe("INT001");
            expect(barang.kategori_id).toBe(categoryId);
            expect(barang.kategori_nama).toBe("Integrity Test");
            
            cleanup();
        });
    });

    describe('Integration with category management operations', () => {
        test('should validate dependencies during bulk category operations', () => {
            const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create multiple categories
            const categories = ["Cat1", "Cat2", "Cat3"];
            const categoryIds = [];
            
            for (const catName of categories) {
                const result = kategoriManager.createKategori({
                    nama: catName,
                    deskripsi: `Category ${catName}`
                });
                expect(result.success).toBe(true);
                categoryIds.push(result.data.id);
            }
            
            // Create barang items for some categories
            const barangResult1 = barangManager.createBarang({
                kode: "BULK001",
                nama: "Bulk Item 1",
                kategori_id: categoryIds[0],
                kategori_nama: "Cat1",
                satuan_id: "unit1",
                satuan_nama: "PCS",
                harga_beli: 10000,
                harga_jual: 15000,
                stok: 10,
                stok_minimum: 5
            });
            
            const barangResult2 = barangManager.createBarang({
                kode: "BULK002",
                nama: "Bulk Item 2",
                kategori_id: categoryIds[2],
                kategori_nama: "Cat3",
                satuan_id: "unit1",
                satuan_nama: "PCS",
                harga_beli: 8000,
                harga_jual: 12000,
                stok: 15,
                stok_minimum: 3
            });
            
            expect(barangResult1.success).toBe(true);
            expect(barangResult2.success).toBe(true);
            
            // Test individual deletions
            // Cat1 should fail (has dependency)
            const delete1 = kategoriManager.deleteKategori(categoryIds[0]);
            expect(delete1.success).toBe(false);
            expect(delete1.details.barang_count).toBe(1);
            
            // Cat2 should succeed (no dependency)
            const delete2 = kategoriManager.deleteKategori(categoryIds[1]);
            expect(delete2.success).toBe(true);
            
            // Cat3 should fail (has dependency)
            const delete3 = kategoriManager.deleteKategori(categoryIds[2]);
            expect(delete3.success).toBe(false);
            expect(delete3.details.barang_count).toBe(1);
            
            cleanup();
        });

        test('should provide consistent dependency information across multiple checks', () => {
            const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create category
            const categoryResult = kategoriManager.createKategori({
                nama: "Consistency Test",
                deskripsi: "Testing consistency"
            });
            
            expect(categoryResult.success).toBe(true);
            const categoryId = categoryResult.data.id;
            
            // Create barang items
            const barangItems = ["CONS001", "CONS002"];
            for (const kode of barangItems) {
                const result = barangManager.createBarang({
                    kode: kode,
                    nama: `Item ${kode}`,
                    kategori_id: categoryId,
                    kategori_nama: "Consistency Test",
                    satuan_id: "unit1",
                    satuan_nama: "PCS",
                    harga_beli: 7000,
                    harga_jual: 10000,
                    stok: 12,
                    stok_minimum: 4
                });
                expect(result.success).toBe(true);
            }
            
            // Multiple dependency checks should return consistent results
            for (let i = 0; i < 3; i++) {
                const deleteResult = kategoriManager.deleteKategori(categoryId);
                expect(deleteResult.success).toBe(false);
                expect(deleteResult.details.barang_count).toBe(2);
                expect(deleteResult.details.barang_list).toHaveLength(2);
                
                const kodelist = deleteResult.details.barang_list.map(b => b.kode);
                expect(kodelist).toContain("CONS001");
                expect(kodelist).toContain("CONS002");
            }
            
            cleanup();
        });
    });

    describe('Performance and scalability', () => {
        test('should handle dependency validation with large number of barang items', () => {
            const { kategoriManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create category
            const categoryResult = kategoriManager.createKategori({
                nama: "Performance Test",
                deskripsi: "Testing with many items"
            });
            
            expect(categoryResult.success).toBe(true);
            const categoryId = categoryResult.data.id;
            
            // Create many barang items (simulate large dataset)
            const itemCount = 50;
            for (let i = 0; i < itemCount; i++) {
                const result = barangManager.createBarang({
                    kode: `PERF${String(i + 1).padStart(3, '0')}`,
                    nama: `Performance Item ${i + 1}`,
                    kategori_id: categoryId,
                    kategori_nama: "Performance Test",
                    satuan_id: "unit1",
                    satuan_nama: "PCS",
                    harga_beli: 5000 + (i * 100),
                    harga_jual: 8000 + (i * 150),
                    stok: 10 + (i % 20),
                    stok_minimum: 2 + (i % 5)
                });
                expect(result.success).toBe(true);
            }
            
            // Dependency validation should still work efficiently
            const startTime = Date.now();
            const deleteResult = kategoriManager.deleteKategori(categoryId);
            const endTime = Date.now();
            
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.details.barang_count).toBe(itemCount);
            expect(deleteResult.details.barang_list).toHaveLength(itemCount);
            
            // Should complete within reasonable time (less than 1 second)
            expect(endTime - startTime).toBeLessThan(1000);
            
            cleanup();
        });
    });
});