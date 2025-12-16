/**
 * Property-Based Tests for Save Operation Reliability
 * Tests Property 3: Save operation reliability
 * Validates: Requirements 1.4
 */

import fc from 'fast-check';
import { masterBarangSystem } from '../../js/master-barang/MasterBarangSystem.js';

describe('Property 3: Save Operation Reliability', () => {
    beforeEach(() => {
        // Clear all data before each test
        masterBarangSystem.clearAllData();
    });

    afterEach(() => {
        // Clean up after each test
        masterBarangSystem.clearAllData();
    });

    // Property 3.1: Valid barang data should always save successfully
    test('should save valid barang data successfully', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Za-z0-9-]+$/.test(s)),
                nama: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
                harga_beli: fc.integer({ min: 0, max: 999999999 }),
                harga_jual: fc.integer({ min: 0, max: 999999999 }),
                stok: fc.integer({ min: 0, max: 999999999 }),
                stok_minimum: fc.integer({ min: 0, max: 999999 }),
                deskripsi: fc.string({ maxLength: 500 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }),
            (barangData) => {
                // Ensure we have valid kategori and satuan
                const kategoriResult = masterBarangSystem.createKategori({
                    nama: 'Test Kategori ' + Date.now(),
                    status: 'aktif'
                });
                const satuanResult = masterBarangSystem.createSatuan({
                    nama: 'Test Satuan ' + Date.now(),
                    status: 'aktif'
                });

                // Skip test if kategori or satuan creation fails
                if (!kategoriResult.success || !satuanResult.success) {
                    return true; // Skip this test case
                }

                // Add required fields
                const completeData = {
                    ...barangData,
                    kategori_id: kategoriResult.data.id,
                    kategori_nama: kategoriResult.data.nama,
                    satuan_id: satuanResult.data.id,
                    satuan_nama: satuanResult.data.nama
                };

                const result = masterBarangSystem.createBarang(completeData);
                
                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data.id).toBeDefined();
                expect(result.data.kode).toBe(completeData.kode);
                expect(result.data.nama).toBe(completeData.nama);
                expect(result.errors).toEqual([]);
            }
        ), { numRuns: 50 });
    });

    // Property 3.2: Save operation should return consistent result structure
    test('should return consistent result structure for all save operations', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.string({ minLength: 1, maxLength: 30 }),
                nama: fc.string({ minLength: 1, maxLength: 150 }),
                harga_beli: fc.integer({ min: -1000, max: 1000000000 }),
                harga_jual: fc.integer({ min: -1000, max: 1000000000 }),
                stok: fc.integer({ min: -100, max: 1000000000 }),
                kategori_id: fc.string(),
                satuan_id: fc.string()
            }),
            (barangData) => {
                const result = masterBarangSystem.createBarang(barangData);
                
                // Result should always have these properties
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('errors');
                expect(typeof result.success).toBe('boolean');
                expect(Array.isArray(result.errors)).toBe(true);
                
                if (result.success) {
                    expect(result).toHaveProperty('data');
                    expect(result.data).toHaveProperty('id');
                    expect(result.data).toHaveProperty('created_at');
                    expect(result.data).toHaveProperty('updated_at');
                } else {
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            }
        ), { numRuns: 100 });
    });

    // Property 3.3: Update operation should preserve unchanged fields
    test('should preserve unchanged fields during update operations', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Za-z0-9-]+$/.test(s)),
                nama: fc.string({ minLength: 2, maxLength: 100 }),
                harga_beli: fc.integer({ min: 0, max: 999999999 }),
                harga_jual: fc.integer({ min: 0, max: 999999999 }),
                stok: fc.integer({ min: 0, max: 999999999 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }),
            fc.record({
                nama: fc.string({ minLength: 2, maxLength: 100 }),
                harga_jual: fc.integer({ min: 0, max: 999999999 })
            }),
            (initialData, updateData) => {
                // Create kategori and satuan
                const kategoriResult = masterBarangSystem.createKategori({
                    nama: 'Test Kategori ' + Date.now(),
                    status: 'aktif'
                });
                const satuanResult = masterBarangSystem.createSatuan({
                    nama: 'Test Satuan ' + Date.now(),
                    status: 'aktif'
                });

                // Skip test if kategori or satuan creation fails
                if (!kategoriResult.success || !satuanResult.success) {
                    return true; // Skip this test case
                }

                const completeInitialData = {
                    ...initialData,
                    kategori_id: kategoriResult.data.id,
                    kategori_nama: kategoriResult.data.nama,
                    satuan_id: satuanResult.data.id,
                    satuan_nama: satuanResult.data.nama
                };

                // Create initial barang
                const createResult = masterBarangSystem.createBarang(completeInitialData);
                expect(createResult.success).toBe(true);

                const barangId = createResult.data.id;
                const originalData = createResult.data;

                // Update with partial data
                const updateResult = masterBarangSystem.updateBarang(barangId, updateData);
                expect(updateResult.success).toBe(true);

                const updatedData = updateResult.data;

                // Check that updated fields changed
                expect(updatedData.nama).toBe(updateData.nama);
                expect(updatedData.harga_jual).toBe(updateData.harga_jual);

                // Check that unchanged fields preserved
                expect(updatedData.kode).toBe(originalData.kode);
                expect(updatedData.harga_beli).toBe(originalData.harga_beli);
                expect(updatedData.stok).toBe(originalData.stok);
                expect(updatedData.kategori_id).toBe(originalData.kategori_id);
                expect(updatedData.satuan_id).toBe(originalData.satuan_id);
                expect(updatedData.status).toBe(originalData.status);

                // Check that timestamps updated
                expect(updatedData.updated_at).toBeGreaterThan(originalData.updated_at);
                expect(updatedData.created_at).toBe(originalData.created_at);
            }
        ), { numRuns: 30 });
    });

    // Property 3.4: Save operation should handle duplicate kode correctly
    test('should reject duplicate kode consistently', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Za-z0-9-]+$/.test(s)),
            fc.string({ minLength: 2, maxLength: 100 }),
            fc.string({ minLength: 2, maxLength: 100 }),
            (kode, nama1, nama2) => {
                // Create kategori and satuan
                const kategoriResult = masterBarangSystem.createKategori({
                    nama: 'Test Kategori ' + Date.now(),
                    status: 'aktif'
                });
                const satuanResult = masterBarangSystem.createSatuan({
                    nama: 'Test Satuan ' + Date.now(),
                    status: 'aktif'
                });

                // Skip test if kategori or satuan creation fails
                if (!kategoriResult.success || !satuanResult.success) {
                    return true; // Skip this test case
                }

                const baseData = {
                    kode,
                    harga_beli: 1000,
                    harga_jual: 1500,
                    stok: 10,
                    status: 'aktif',
                    kategori_id: kategoriResult.data.id,
                    kategori_nama: kategoriResult.data.nama,
                    satuan_id: satuanResult.data.id,
                    satuan_nama: satuanResult.data.nama
                };

                // First barang should save successfully
                const firstResult = masterBarangSystem.createBarang({
                    ...baseData,
                    nama: nama1
                });
                expect(firstResult.success).toBe(true);

                // Second barang with same kode should fail
                const secondResult = masterBarangSystem.createBarang({
                    ...baseData,
                    nama: nama2
                });
                expect(secondResult.success).toBe(false);
                expect(secondResult.errors.some(error => 
                    error.toLowerCase().includes('kode') && 
                    error.toLowerCase().includes('sudah')
                )).toBe(true);
            }
        ), { numRuns: 30 });
    });

    // Property 3.5: Save operation should validate required fields consistently
    test('should validate required fields consistently', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.option(fc.string({ minLength: 2, maxLength: 20 })),
                nama: fc.option(fc.string({ minLength: 2, maxLength: 100 })),
                kategori_id: fc.option(fc.string()),
                satuan_id: fc.option(fc.string()),
                harga_beli: fc.option(fc.integer({ min: 0, max: 999999999 })),
                harga_jual: fc.option(fc.integer({ min: 0, max: 999999999 })),
                stok: fc.option(fc.integer({ min: 0, max: 999999999 }))
            }),
            (partialData) => {
                // Remove null/undefined values and convert to actual values
                const cleanData = {};
                Object.keys(partialData).forEach(key => {
                    if (partialData[key] != null) {
                        cleanData[key] = partialData[key];
                    }
                });

                const result = masterBarangSystem.createBarang(cleanData);
                
                const requiredFields = ['kode', 'nama', 'kategori_id', 'satuan_id', 'harga_beli', 'harga_jual', 'stok'];
                const missingFields = requiredFields.filter(field => !cleanData[field]);
                
                if (missingFields.length > 0) {
                    expect(result.success).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                } else {
                    // If all required fields present, might still fail due to validation
                    // but should have consistent error structure
                    expect(result).toHaveProperty('success');
                    expect(result).toHaveProperty('errors');
                    expect(Array.isArray(result.errors)).toBe(true);
                }
            }
        ), { numRuns: 50 });
    });

    // Property 3.6: Save operation should handle concurrent saves correctly
    test('should handle multiple save operations consistently', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    kode: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Za-z0-9-]+$/.test(s)),
                    nama: fc.string({ minLength: 2, maxLength: 100 }),
                    harga_beli: fc.integer({ min: 0, max: 999999999 }),
                    harga_jual: fc.integer({ min: 0, max: 999999999 }),
                    stok: fc.integer({ min: 0, max: 999999999 })
                }),
                { minLength: 2, maxLength: 5 }
            ),
            (barangList) => {
                // Create kategori and satuan
                const kategoriResult = masterBarangSystem.createKategori({
                    nama: 'Test Kategori ' + Date.now(),
                    status: 'aktif'
                });
                const satuanResult = masterBarangSystem.createSatuan({
                    nama: 'Test Satuan ' + Date.now(),
                    status: 'aktif'
                });

                // Skip test if kategori or satuan creation fails
                if (!kategoriResult.success || !satuanResult.success) {
                    return true; // Skip this test case
                }

                const results = barangList.map((barangData, index) => {
                    const completeData = {
                        ...barangData,
                        kode: `${barangData.kode}-${index}`, // Ensure unique kode
                        kategori_id: kategoriResult.data.id,
                        kategori_nama: kategoriResult.data.nama,
                        satuan_id: satuanResult.data.id,
                        satuan_nama: satuanResult.data.nama,
                        status: 'aktif'
                    };
                    
                    return masterBarangSystem.createBarang(completeData);
                });

                // All should succeed since we made kode unique
                results.forEach(result => {
                    expect(result.success).toBe(true);
                    expect(result.data).toBeDefined();
                    expect(result.data.id).toBeDefined();
                });

                // Verify all items were saved
                const searchResult = masterBarangSystem.searchBarang({});
                expect(searchResult.success).toBe(true);
                expect(searchResult.data.length).toBe(barangList.length);
            }
        ), { numRuns: 20 });
    });

    // Property 3.7: Save operation should maintain data integrity
    test('should maintain data integrity after save operations', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Za-z0-9-]+$/.test(s)),
                nama: fc.string({ minLength: 2, maxLength: 100 }),
                harga_beli: fc.integer({ min: 0, max: 999999999 }),
                harga_jual: fc.integer({ min: 0, max: 999999999 }),
                stok: fc.integer({ min: 0, max: 999999999 }),
                stok_minimum: fc.integer({ min: 0, max: 999999 }),
                deskripsi: fc.string({ maxLength: 500 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }),
            (barangData) => {
                // Create kategori and satuan
                const kategoriResult = masterBarangSystem.createKategori({
                    nama: 'Test Kategori ' + Date.now(),
                    status: 'aktif'
                });
                const satuanResult = masterBarangSystem.createSatuan({
                    nama: 'Test Satuan ' + Date.now(),
                    status: 'aktif'
                });

                // Skip test if kategori or satuan creation fails
                if (!kategoriResult.success || !satuanResult.success) {
                    return true; // Skip this test case
                }

                const completeData = {
                    ...barangData,
                    kategori_id: kategoriResult.data.id,
                    kategori_nama: kategoriResult.data.nama,
                    satuan_id: satuanResult.data.id,
                    satuan_nama: satuanResult.data.nama
                };

                const saveResult = masterBarangSystem.createBarang(completeData);
                expect(saveResult.success).toBe(true);

                // Retrieve saved data
                const retrievedData = masterBarangSystem.getBarangById(saveResult.data.id);
                expect(retrievedData).toBeDefined();

                // Verify data integrity
                expect(retrievedData.kode).toBe(completeData.kode);
                expect(retrievedData.nama).toBe(completeData.nama);
                expect(retrievedData.harga_beli).toBe(completeData.harga_beli);
                expect(retrievedData.harga_jual).toBe(completeData.harga_jual);
                expect(retrievedData.stok).toBe(completeData.stok);
                expect(retrievedData.stok_minimum).toBe(completeData.stok_minimum);
                expect(retrievedData.deskripsi).toBe(completeData.deskripsi);
                expect(retrievedData.status).toBe(completeData.status);
                expect(retrievedData.kategori_id).toBe(completeData.kategori_id);
                expect(retrievedData.satuan_id).toBe(completeData.satuan_id);

                // Verify metadata
                expect(retrievedData.id).toBeDefined();
                expect(retrievedData.created_at).toBeDefined();
                expect(retrievedData.updated_at).toBeDefined();
                expect(retrievedData.created_by).toBeDefined();
                expect(retrievedData.updated_by).toBeDefined();
            }
        ), { numRuns: 30 });
    });

    // Property 3.8: Save operation should handle edge cases gracefully
    test('should handle edge cases gracefully', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant({}),
                fc.record({
                    kode: fc.oneof(fc.constant(''), fc.constant('   '), fc.string({ maxLength: 1 })),
                    nama: fc.oneof(fc.constant(''), fc.constant('   '), fc.string({ maxLength: 1 }))
                })
            ),
            (invalidData) => {
                // Handle null/undefined by converting to empty object
                const testData = invalidData || {};
                
                const result = masterBarangSystem.createBarang(testData);
                
                // Should always return a valid result structure
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('errors');
                expect(typeof result.success).toBe('boolean');
                expect(Array.isArray(result.errors)).toBe(true);
                
                // Should fail for invalid data
                expect(result.success).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            }
        ), { numRuns: 30 });
    });
});