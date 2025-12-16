/**
 * Property Test 18: Unit management validation
 * 
 * Property: For any unit management operation, the system should validate name uniqueness 
 * and check dependencies with existing barang items
 * 
 * Validates: Requirements 5.5
 */

import fc from 'fast-check';
import { SatuanManager } from '../../js/master-barang/SatuanManager.js';
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
    const satuanManager = new SatuanManager();
    const barangManager = new BarangManager();
    
    // Set up dependency injection
    satuanManager.setBarangManager(barangManager);
    
    // Initialize with empty data
    satuanManager.data = [];
    barangManager.data = [];
    
    // Return managers and cleanup function
    return {
        satuanManager,
        barangManager,
        cleanup: () => {
            global.localStorage = originalLocalStorage;
        }
    };
}

describe('Property Test 18: Unit management validation', () => {
    
    describe('Basic unit management functionality', () => {
        test('should create unit with valid data successfully', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            const result = satuanManager.createSatuan({
                nama: "PCS",
                deskripsi: "Pieces - per buah"
            });
            
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.nama).toBe("PCS");
            expect(result.data.deskripsi).toBe("Pieces - per buah");
            
            cleanup();
        });

        test('should validate unit name uniqueness', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            // Create first unit
            const firstResult = satuanManager.createSatuan({
                nama: "KG",
                deskripsi: "Kilogram"
            });
            
            expect(firstResult.success).toBe(true);
            
            // Attempt to create duplicate with exact same case
            const duplicateResult = satuanManager.createSatuan({
                nama: "KG", // Same case
                deskripsi: "Kilogram duplicate"
            });
            
            expect(duplicateResult.success).toBe(false);
            expect(duplicateResult.errors[0]).toContain('sudah ada');
            
            cleanup();
        });

        test('should normalize unit names to uppercase', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            const result = satuanManager.createSatuan({
                nama: "pcs",
                deskripsi: "Pieces"
            });
            
            expect(result.success).toBe(true);
            expect(result.data.nama).toBe("PCS");
            
            cleanup();
        });

        test('should validate unit name length constraints', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            // Test empty name
            const emptyResult = satuanManager.createSatuan({
                nama: "",
                deskripsi: "Empty name"
            });
            
            expect(emptyResult.success).toBe(false);
            expect(emptyResult.errors[0]).toContain('Nama Satuan');
            
            // Test too long name
            const longResult = satuanManager.createSatuan({
                nama: "A".repeat(21),
                deskripsi: "Too long name"
            });
            
            expect(longResult.success).toBe(false);
            expect(longResult.errors[0]).toContain('1-20 karakter');
            
            cleanup();
        });

        test('should prevent deletion of unit with dependencies', () => {
            const { satuanManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create unit
            const unitResult = satuanManager.createSatuan({
                nama: "DUS",
                deskripsi: "Dus/Box"
            });
            
            expect(unitResult.success).toBe(true);
            const unitId = unitResult.data.id;
            
            // Create barang using this unit
            const barangResult = barangManager.createBarang({
                kode: "DUS001",
                nama: "Test Item",
                kategori_id: "cat1",
                kategori_nama: "Category",
                satuan_id: unitId,
                satuan_nama: "DUS",
                harga_beli: 10000,
                harga_jual: 15000,
                stok: 10,
                stok_minimum: 5
            });
            
            expect(barangResult.success).toBe(true);
            
            // Delete should fail due to dependency
            const deleteResult = satuanManager.deleteSatuan(unitId);
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.errors[0]).toContain('digunakan');
            expect(deleteResult.details).toBeDefined();
            expect(deleteResult.details.barang_count).toBe(1);
            
            cleanup();
        });
    });

    describe('Property-based unit uniqueness validation tests', () => {
        test('should consistently validate unit name uniqueness', () => {
            fc.assert(fc.property(
                fc.constantFrom("PCS", "KG", "LITER", "METER", "DUS", "PACK", "SET", "UNIT"),
                fc.string({ minLength: 0, maxLength: 100 }),
                (unitName, description) => {
                    const { satuanManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Create first unit
                        const firstResult = satuanManager.createSatuan({
                            nama: unitName,
                            deskripsi: description
                        });
                        
                        expect(firstResult.success).toBe(true);
                        expect(firstResult.data.nama).toBe(unitName.toUpperCase());
                        
                        // Attempt to create duplicate with same name
                        const duplicateResult = satuanManager.createSatuan({
                            nama: unitName.toLowerCase(),
                            deskripsi: 'Different description'
                        });
                        
                        expect(duplicateResult.success).toBe(false);
                        expect(duplicateResult.errors[0]).toContain('sudah ada');
                        
                        // Attempt with mixed case
                        const mixedCaseResult = satuanManager.createSatuan({
                            nama: unitName.charAt(0).toUpperCase() + unitName.slice(1).toLowerCase(),
                            deskripsi: 'Mixed case'
                        });
                        
                        expect(mixedCaseResult.success).toBe(false);
                        expect(mixedCaseResult.errors[0]).toContain('sudah ada');
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 8 });
        });

        test('should allow creation of units with different names', () => {
            fc.assert(fc.property(
                fc.shuffledSubarray(["PCS", "KG", "LITER", "METER", "DUS", "PACK", "SET", "UNIT"], { minLength: 2, maxLength: 4 }),
                (unitNames) => {
                    const { satuanManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        const results = [];
                        
                        // Create units with unique names
                        for (const name of unitNames) {
                            const result = satuanManager.createSatuan({
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
                        
                        // Verify all units are stored
                        const allUnits = satuanManager.getAll();
                        expect(allUnits.length).toBe(results.length);
                        
                        // Verify names are unique in storage
                        const storedNames = allUnits.map(unit => unit.nama);
                        const uniqueStoredNames = [...new Set(storedNames)];
                        expect(storedNames.length).toBe(uniqueStoredNames.length);
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 10 });
        });

        test('should handle whitespace normalization in unit names', () => {
            fc.assert(fc.property(
                fc.constantFrom("PCS", "KG", "LITER", "METER"),
                fc.nat({ max: 3 }),
                fc.nat({ max: 3 }),
                (baseName, leadingSpaces, trailingSpaces) => {
                    const { satuanManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        const nameWithSpaces = ' '.repeat(leadingSpaces) + baseName + ' '.repeat(trailingSpaces);
                        
                        // Create unit with base name
                        const firstResult = satuanManager.createSatuan({
                            nama: baseName,
                            deskripsi: 'First unit'
                        });
                        
                        expect(firstResult.success).toBe(true);
                        
                        // Attempt to create with extra whitespace
                        const spacedResult = satuanManager.createSatuan({
                            nama: nameWithSpaces,
                            deskripsi: 'Spaced unit'
                        });
                        
                        // Should fail due to uniqueness (after trimming and normalizing)
                        expect(spacedResult.success).toBe(false);
                        expect(spacedResult.errors[0]).toContain('sudah ada');
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 8 });
        });
    });

    describe('Unit dependency validation tests', () => {
        test('should consistently prevent deletion when dependencies exist', () => {
            fc.assert(fc.property(
                fc.constantFrom("PCS", "KG", "LITER", "DUS", "PACK"),
                fc.array(fc.record({
                    kode: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
                    nama: fc.string({ minLength: 3, maxLength: 30 })
                }), { minLength: 1, maxLength: 5 }),
                (unitName, barangItems) => {
                    const { satuanManager, barangManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Create unit
                        const unitResult = satuanManager.createSatuan({
                            nama: unitName,
                            deskripsi: `Unit for ${unitName}`
                        });
                        
                        expect(unitResult.success).toBe(true);
                        const unitId = unitResult.data.id;
                        
                        // Create barang items using this unit
                        const createdBarang = [];
                        for (const item of barangItems) {
                            const barangResult = barangManager.createBarang({
                                kode: item.kode,
                                nama: item.nama,
                                kategori_id: "cat1",
                                kategori_nama: "Category",
                                satuan_id: unitId,
                                satuan_nama: unitName,
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
                            const deleteResult = satuanManager.deleteSatuan(unitId);
                            expect(deleteResult.success).toBe(false);
                            expect(deleteResult.errors.length).toBeGreaterThan(0);
                            expect(deleteResult.details).toBeDefined();
                            expect(deleteResult.details.barang_count).toBe(createdBarang.length);
                            
                            // Unit should still exist
                            const existingUnit = satuanManager.findById(unitId);
                            expect(existingUnit).not.toBeNull();
                        }
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 10 });
        });

        test('should allow deletion after removing all dependencies', () => {
            fc.assert(fc.property(
                fc.constantFrom("METER", "GRAM", "ML", "CM"),
                fc.array(fc.string({ minLength: 3, maxLength: 8 }), { minLength: 1, maxLength: 3 }),
                (unitName, barangCodes) => {
                    const { satuanManager, barangManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Create unit
                        const unitResult = satuanManager.createSatuan({
                            nama: unitName,
                            deskripsi: `Unit for ${unitName}`
                        });
                        
                        expect(unitResult.success).toBe(true);
                        const unitId = unitResult.data.id;
                        
                        // Create barang items using this unit
                        const createdBarangIds = [];
                        for (const kode of barangCodes) {
                            const barangResult = barangManager.createBarang({
                                kode: kode.toUpperCase(),
                                nama: `Item ${kode}`,
                                kategori_id: "cat1",
                                kategori_nama: "Category",
                                satuan_id: unitId,
                                satuan_nama: unitName,
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
                            const deleteResult1 = satuanManager.deleteSatuan(unitId);
                            expect(deleteResult1.success).toBe(false);
                            
                            // Remove all barang dependencies
                            for (const barangId of createdBarangIds) {
                                const deleteBarangResult = barangManager.delete(barangId);
                                expect(deleteBarangResult).toBe(true);
                            }
                            
                            // Verify no dependencies remain
                            const remainingBarang = barangManager.getBySatuan(unitId);
                            expect(remainingBarang.length).toBe(0);
                            
                            // Now deletion should succeed
                            const deleteResult2 = satuanManager.deleteSatuan(unitId);
                            expect(deleteResult2.success).toBe(true);
                            expect(deleteResult2.errors.length).toBe(0);
                            
                            // Verify unit is deleted
                            const deletedUnit = satuanManager.findById(unitId);
                            expect(deletedUnit).toBeNull();
                        }
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 8 });
        });
    });

    describe('Unit update validation tests', () => {
        test('should prevent updating unit to duplicate name', () => {
            fc.assert(fc.property(
                fc.constantFrom("PCS", "KG", "LITER", "METER"),
                fc.constantFrom("DUS", "PACK", "SET", "UNIT"),
                (firstName, secondName) => {
                    const { satuanManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Skip if names are the same
                        if (firstName.toLowerCase() === secondName.toLowerCase()) return;
                        
                        // Create two units
                        const firstResult = satuanManager.createSatuan({
                            nama: firstName,
                            deskripsi: 'First unit'
                        });
                        
                        const secondResult = satuanManager.createSatuan({
                            nama: secondName,
                            deskripsi: 'Second unit'
                        });
                        
                        expect(firstResult.success).toBe(true);
                        expect(secondResult.success).toBe(true);
                        
                        // Attempt to update second unit to have same name as first
                        const updateResult = satuanManager.updateSatuan(secondResult.data.id, {
                            nama: firstName.toLowerCase()
                        });
                        
                        // Update should fail due to uniqueness
                        expect(updateResult.success).toBe(false);
                        expect(updateResult.errors[0]).toContain('sudah ada');
                        
                        // Verify original data is unchanged
                        const unchangedUnit = satuanManager.findById(secondResult.data.id);
                        expect(unchangedUnit.nama).toBe(secondName.toUpperCase());
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 8 });
        });

        test('should allow updating unit with same name (no change)', () => {
            fc.assert(fc.property(
                fc.constantFrom("PCS", "KG", "LITER", "METER"),
                fc.string({ minLength: 0, maxLength: 100 }),
                (unitName, newDescription) => {
                    const { satuanManager, cleanup } = createIsolatedManagers();
                    
                    try {
                        // Create unit
                        const createResult = satuanManager.createSatuan({
                            nama: unitName,
                            deskripsi: 'Original description'
                        });
                        
                        expect(createResult.success).toBe(true);
                        
                        // Update with same name but different description
                        const updateResult = satuanManager.updateSatuan(createResult.data.id, {
                            nama: unitName.toLowerCase(),
                            deskripsi: newDescription
                        });
                        
                        // Update should succeed
                        expect(updateResult.success).toBe(true);
                        expect(updateResult.data.nama).toBe(unitName.toUpperCase());
                        expect(updateResult.data.deskripsi).toBe(newDescription.trim());
                        
                    } finally {
                        cleanup();
                    }
                }
            ), { numRuns: 8 });
        });

        test('should update denormalized unit names in barang data', () => {
            const { satuanManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create unit
            const unitResult = satuanManager.createSatuan({
                nama: "PCS",
                deskripsi: "Pieces"
            });
            
            expect(unitResult.success).toBe(true);
            const unitId = unitResult.data.id;
            
            // Create barang using this unit
            const barangResult = barangManager.createBarang({
                kode: "TEST001",
                nama: "Test Item",
                kategori_id: "cat1",
                kategori_nama: "Category",
                satuan_id: unitId,
                satuan_nama: "PCS",
                harga_beli: 10000,
                harga_jual: 15000,
                stok: 10,
                stok_minimum: 5
            });
            
            expect(barangResult.success).toBe(true);
            const barangId = barangResult.data.id;
            
            // Update unit name
            const updateResult = satuanManager.updateSatuan(unitId, {
                nama: "PIECES"
            });
            
            expect(updateResult.success).toBe(true);
            expect(updateResult.data.nama).toBe("PIECES");
            
            // Verify barang data is updated
            const updatedBarang = barangManager.findById(barangId);
            expect(updatedBarang.satuan_nama).toBe("PIECES");
            
            cleanup();
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle deletion of non-existent unit', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            const nonExistentId = "non-existent-id";
            const deleteResult = satuanManager.deleteSatuan(nonExistentId);
            
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.errors.length).toBeGreaterThan(0);
            expect(deleteResult.errors[0]).toContain('tidak ditemukan');
            
            cleanup();
        });

        test('should handle barang manager not being set', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            // Remove barang manager reference
            satuanManager.barangManager = null;
            
            // Create unit
            const unitResult = satuanManager.createSatuan({
                nama: "TEST",
                deskripsi: "Test unit"
            });
            
            expect(unitResult.success).toBe(true);
            const unitId = unitResult.data.id;
            
            // Delete should succeed (no dependency check possible)
            const deleteResult = satuanManager.deleteSatuan(unitId);
            expect(deleteResult.success).toBe(true);
            
            cleanup();
        });

        test('should validate description length constraints', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            const result = satuanManager.createSatuan({
                nama: "TEST",
                deskripsi: "A".repeat(101) // Too long
            });
            
            expect(result.success).toBe(false);
            expect(result.errors[0]).toContain('maksimal 100 karakter');
            
            cleanup();
        });

        test('should maintain data integrity during failed operations', () => {
            const { satuanManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create unit
            const unitResult = satuanManager.createSatuan({
                nama: "INTEGRITY",
                deskripsi: "Testing data integrity"
            });
            
            expect(unitResult.success).toBe(true);
            const unitId = unitResult.data.id;
            
            // Create barang using this unit
            const barangResult = barangManager.createBarang({
                kode: "INT001",
                nama: "Integrity Item",
                kategori_id: "cat1",
                kategori_nama: "Category",
                satuan_id: unitId,
                satuan_nama: "INTEGRITY",
                harga_beli: 12000,
                harga_jual: 18000,
                stok: 8,
                stok_minimum: 2
            });
            
            expect(barangResult.success).toBe(true);
            const barangId = barangResult.data.id;
            
            // Multiple failed deletion attempts
            for (let i = 0; i < 5; i++) {
                const deleteResult = satuanManager.deleteSatuan(unitId);
                expect(deleteResult.success).toBe(false);
            }
            
            // Verify unit data is unchanged
            const unit = satuanManager.findById(unitId);
            expect(unit).not.toBeNull();
            expect(unit.nama).toBe("INTEGRITY");
            expect(unit.deskripsi).toBe("Testing data integrity");
            
            // Verify barang data is unchanged
            const barang = barangManager.findById(barangId);
            expect(barang).not.toBeNull();
            expect(barang.kode).toBe("INT001");
            expect(barang.satuan_id).toBe(unitId);
            expect(barang.satuan_nama).toBe("INTEGRITY");
            
            cleanup();
        });
    });

    describe('Integration with unit management operations', () => {
        test('should validate dependencies during bulk unit operations', () => {
            const { satuanManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create multiple units
            const units = ["UNIT1", "UNIT2", "UNIT3"];
            const unitIds = [];
            
            for (const unitName of units) {
                const result = satuanManager.createSatuan({
                    nama: unitName,
                    deskripsi: `Unit ${unitName}`
                });
                expect(result.success).toBe(true);
                unitIds.push(result.data.id);
            }
            
            // Create barang items for some units
            const barangResult1 = barangManager.createBarang({
                kode: "BULK001",
                nama: "Bulk Item 1",
                kategori_id: "cat1",
                kategori_nama: "Category",
                satuan_id: unitIds[0],
                satuan_nama: "UNIT1",
                harga_beli: 10000,
                harga_jual: 15000,
                stok: 10,
                stok_minimum: 5
            });
            
            const barangResult2 = barangManager.createBarang({
                kode: "BULK002",
                nama: "Bulk Item 2",
                kategori_id: "cat1",
                kategori_nama: "Category",
                satuan_id: unitIds[2],
                satuan_nama: "UNIT3",
                harga_beli: 8000,
                harga_jual: 12000,
                stok: 15,
                stok_minimum: 3
            });
            
            expect(barangResult1.success).toBe(true);
            expect(barangResult2.success).toBe(true);
            
            // Test individual deletions
            // UNIT1 should fail (has dependency)
            const delete1 = satuanManager.deleteSatuan(unitIds[0]);
            expect(delete1.success).toBe(false);
            expect(delete1.details.barang_count).toBe(1);
            
            // UNIT2 should succeed (no dependency)
            const delete2 = satuanManager.deleteSatuan(unitIds[1]);
            expect(delete2.success).toBe(true);
            
            // UNIT3 should fail (has dependency)
            const delete3 = satuanManager.deleteSatuan(unitIds[2]);
            expect(delete3.success).toBe(false);
            expect(delete3.details.barang_count).toBe(1);
            
            cleanup();
        });

        test('should handle bulk status updates correctly', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            const unitNames = ["BULK1", "BULK2", "BULK3"];
            const createdIds = [];
            
            // Create units
            for (const name of unitNames) {
                const result = satuanManager.createSatuan({
                    nama: name,
                    deskripsi: `Unit ${name}`
                });
                
                expect(result.success).toBe(true);
                createdIds.push(result.data.id);
            }
            
            // Bulk update status
            const bulkResult = satuanManager.bulkUpdateStatus(createdIds, 'nonaktif');
            expect(bulkResult.success).toBe(createdIds.length);
            expect(bulkResult.failed).toBe(0);
            
            // Verify all units are inactive
            const allUnits = satuanManager.getAll();
            const targetUnits = allUnits.filter(unit => createdIds.includes(unit.id));
            targetUnits.forEach(unit => {
                expect(unit.status).toBe('nonaktif');
            });
            
            cleanup();
        });

        test('should provide consistent unit statistics', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            // Create units with different statuses
            const activeUnits = ["ACTIVE1", "ACTIVE2"];
            const inactiveUnits = ["INACTIVE1"];
            
            for (const name of activeUnits) {
                const result = satuanManager.createSatuan({
                    nama: name,
                    deskripsi: `Active unit ${name}`
                });
                expect(result.success).toBe(true);
            }
            
            for (const name of inactiveUnits) {
                const result = satuanManager.createSatuan({
                    nama: name,
                    deskripsi: `Inactive unit ${name}`,
                    status: 'nonaktif'
                });
                expect(result.success).toBe(true);
            }
            
            const stats = satuanManager.getStatistics();
            expect(stats.total_satuan).toBe(3);
            expect(stats.active_satuan).toBe(2);
            expect(stats.inactive_satuan).toBe(1);
            
            cleanup();
        });
    });

    describe('Unit import and auto-creation functionality', () => {
        test('should handle unit import with auto-creation', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            const unitNames = ["PCS", "KG", "LITER", null, ""];
            
            const importResult = satuanManager.importSatuanNames(unitNames);
            
            expect(importResult.created.length).toBe(3); // PCS, KG, LITER
            expect(importResult.existing.length).toBe(0);
            expect(importResult.errors.length).toBe(2); // null and empty string
            
            // Verify created units
            const createdNames = importResult.created.map(u => u.nama);
            expect(createdNames).toContain("PCS");
            expect(createdNames).toContain("KG");
            expect(createdNames).toContain("LITER");
            
            cleanup();
        });

        test('should initialize default units when empty', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            // Verify no units exist
            expect(satuanManager.getCount()).toBe(0);
            
            const initResult = satuanManager.initializeDefaultSatuan();
            expect(initResult.success).toBe(true);
            expect(initResult.created).toBe(5);
            
            // Verify default units are created
            const allUnits = satuanManager.getAll();
            expect(allUnits.length).toBe(5);
            
            const unitNames = allUnits.map(u => u.nama);
            expect(unitNames).toContain("PCS");
            expect(unitNames).toContain("DUS");
            expect(unitNames).toContain("KG");
            expect(unitNames).toContain("LITER");
            expect(unitNames).toContain("METER");
            
            cleanup();
        });

        test('should provide common unit suggestions', () => {
            const { satuanManager, cleanup } = createIsolatedManagers();
            
            const suggestions = satuanManager.getCommonSatuanSuggestions();
            
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions).toContain("PCS");
            expect(suggestions).toContain("KG");
            expect(suggestions).toContain("LITER");
            expect(suggestions).toContain("DUS");
            
            cleanup();
        });
    });

    describe('Performance and scalability', () => {
        test('should handle dependency validation with large number of barang items', () => {
            const { satuanManager, barangManager, cleanup } = createIsolatedManagers();
            
            // Create unit
            const unitResult = satuanManager.createSatuan({
                nama: "PERF",
                deskripsi: "Performance test unit"
            });
            
            expect(unitResult.success).toBe(true);
            const unitId = unitResult.data.id;
            
            // Create many barang items (simulate large dataset)
            const itemCount = 50;
            for (let i = 0; i < itemCount; i++) {
                const result = barangManager.createBarang({
                    kode: `PERF${String(i + 1).padStart(3, '0')}`,
                    nama: `Performance Item ${i + 1}`,
                    kategori_id: "cat1",
                    kategori_nama: "Category",
                    satuan_id: unitId,
                    satuan_nama: "PERF",
                    harga_beli: 5000 + (i * 100),
                    harga_jual: 8000 + (i * 150),
                    stok: 10 + (i % 20),
                    stok_minimum: 2 + (i % 5)
                });
                expect(result.success).toBe(true);
            }
            
            // Dependency validation should still work efficiently
            const startTime = Date.now();
            const deleteResult = satuanManager.deleteSatuan(unitId);
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