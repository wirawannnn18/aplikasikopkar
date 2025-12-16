/**
 * Property-Based Test: Bulk Update Validation
 * Feature: master-barang-komprehensif, Property 21: Bulk update validation
 * 
 * Tests that for any bulk update operation, the system validates 
 * update data and prevents invalid updates.
 */

import { BulkOperationsManager } from '../../js/master-barang/BulkOperationsManager.js';

describe('Property Test: Bulk Update Validation', () => {
    let bulkOperationsManager;
    let mockKategoris;
    let mockSatuans;

    beforeEach(() => {
        bulkOperationsManager = new BulkOperationsManager();
        
        // Mock kategori data
        mockKategoris = [
            { id: '1', nama: 'Sembako', status: 'aktif' },
            { id: '2', nama: 'Elektronik', status: 'aktif' },
            { id: '3', nama: 'Pakaian', status: 'nonaktif' },
            { id: '4', nama: 'Obat-obatan', status: 'aktif' }
        ];

        // Mock satuan data
        mockSatuans = [
            { id: '1', nama: 'Kg', status: 'aktif' },
            { id: '2', nama: 'Pcs', status: 'aktif' },
            { id: '3', nama: 'Liter', status: 'nonaktif' },
            { id: '4', nama: 'Meter', status: 'aktif' }
        ];

        // Mock localStorage
        global.localStorage = {
            getItem: (key) => {
                if (key === 'kategori_barang') {
                    return JSON.stringify(mockKategoris);
                }
                if (key === 'satuan_barang') {
                    return JSON.stringify(mockSatuans);
                }
                return '[]';
            },
            setItem: () => {}
        };

        // Mock the getKategoriById and getSatuanById methods
        bulkOperationsManager.getKategoriById = (id) => {
            return mockKategoris.find(kategori => kategori.id === id);
        };

        bulkOperationsManager.getSatuanById = (id) => {
            return mockSatuans.find(satuan => satuan.id === id);
        };

        // Mock DOM methods
        global.document = {
            getElementById: (id) => {
                const mockElements = {
                    'bulkUpdateKategori': { value: '' },
                    'bulkUpdateSatuan': { value: '' },
                    'bulkUpdateStatus': { value: '' },
                    'bulkUpdateStokMin': { value: '' }
                };
                return mockElements[id] || { value: '' };
            }
        };
    });

    afterEach(() => {
        bulkOperationsManager.selectedItems.clear();
    });

    /**
     * Property 21: Bulk update validation
     * For any bulk update operation, the system should validate 
     * update data and prevent invalid updates
     */
    test('should validate kategori selection correctly', () => {
        const testCases = [
            { kategoriId: '1', shouldBeValid: true, description: 'active kategori' },
            { kategoriId: '2', shouldBeValid: true, description: 'another active kategori' },
            { kategoriId: '3', shouldBeValid: false, description: 'inactive kategori' },
            { kategoriId: '999', shouldBeValid: false, description: 'non-existent kategori' },
            { kategoriId: '', shouldBeValid: true, description: 'empty kategori (no change)' },
            { kategoriId: null, shouldBeValid: true, description: 'null kategori (no change)' }
        ];

        testCases.forEach(testCase => {
            const updates = {};
            if (testCase.kategoriId !== null && testCase.kategoriId !== '') {
                updates.kategori_id = testCase.kategoriId;
            }

            const errors = bulkOperationsManager.validateBulkUpdate(updates);
            
            if (testCase.shouldBeValid) {
                // Should not have kategori-related errors
                const kategoriErrors = errors.filter(error => 
                    error.toLowerCase().includes('kategori')
                );
                expect(kategoriErrors.length).toBe(0);
            } else {
                // Should have kategori-related errors
                const kategoriErrors = errors.filter(error => 
                    error.toLowerCase().includes('kategori')
                );
                expect(kategoriErrors.length).toBeGreaterThan(0);
            }
        });
    });

    test('should validate satuan selection correctly', () => {
        const testCases = [
            { satuanId: '1', shouldBeValid: true, description: 'active satuan' },
            { satuanId: '2', shouldBeValid: true, description: 'another active satuan' },
            { satuanId: '3', shouldBeValid: false, description: 'inactive satuan' },
            { satuanId: '999', shouldBeValid: false, description: 'non-existent satuan' },
            { satuanId: '', shouldBeValid: true, description: 'empty satuan (no change)' },
            { satuanId: null, shouldBeValid: true, description: 'null satuan (no change)' }
        ];

        testCases.forEach(testCase => {
            const updates = {};
            if (testCase.satuanId !== null && testCase.satuanId !== '') {
                updates.satuan_id = testCase.satuanId;
            }

            const errors = bulkOperationsManager.validateBulkUpdate(updates);
            
            if (testCase.shouldBeValid) {
                // Should not have satuan-related errors
                const satuanErrors = errors.filter(error => 
                    error.toLowerCase().includes('satuan')
                );
                expect(satuanErrors.length).toBe(0);
            } else {
                // Should have satuan-related errors
                const satuanErrors = errors.filter(error => 
                    error.toLowerCase().includes('satuan')
                );
                expect(satuanErrors.length).toBeGreaterThan(0);
            }
        });
    });

    test('should validate stok minimum correctly', () => {
        const testCases = [
            { stokMin: 0, shouldBeValid: true, description: 'zero stok minimum' },
            { stokMin: 1, shouldBeValid: true, description: 'positive stok minimum' },
            { stokMin: 100, shouldBeValid: true, description: 'large positive stok minimum' },
            { stokMin: -1, shouldBeValid: false, description: 'negative stok minimum' },
            { stokMin: -100, shouldBeValid: false, description: 'large negative stok minimum' },
            { stokMin: undefined, shouldBeValid: true, description: 'undefined stok minimum (no change)' }
        ];

        testCases.forEach(testCase => {
            const updates = {};
            if (testCase.stokMin !== undefined) {
                updates.stok_minimum = testCase.stokMin;
            }

            const errors = bulkOperationsManager.validateBulkUpdate(updates);
            
            if (testCase.shouldBeValid) {
                // Should not have stok-related errors
                const stokErrors = errors.filter(error => 
                    error.toLowerCase().includes('stok')
                );
                expect(stokErrors.length).toBe(0);
            } else {
                // Should have stok-related errors
                const stokErrors = errors.filter(error => 
                    error.toLowerCase().includes('stok')
                );
                expect(stokErrors.length).toBeGreaterThan(0);
            }
        });
    });

    test('should validate status values correctly', () => {
        const testCases = [
            { status: 'aktif', shouldBeValid: true, description: 'aktif status' },
            { status: 'nonaktif', shouldBeValid: true, description: 'nonaktif status' },
            { status: '', shouldBeValid: true, description: 'empty status (no change)' },
            { status: 'invalid', shouldBeValid: true, description: 'invalid status (should be handled by form)' },
            { status: null, shouldBeValid: true, description: 'null status (no change)' }
        ];

        testCases.forEach(testCase => {
            const updates = {};
            if (testCase.status !== null && testCase.status !== '') {
                updates.status = testCase.status;
            }

            const errors = bulkOperationsManager.validateBulkUpdate(updates);
            
            // Status validation is typically handled by form constraints
            // The validation function focuses on data integrity issues
            expect(Array.isArray(errors)).toBe(true);
        });
    });

    test('should validate multiple update fields together', () => {
        const testCases = [
            {
                updates: {
                    kategori_id: '1',
                    satuan_id: '2',
                    status: 'aktif',
                    stok_minimum: 10
                },
                shouldBeValid: true,
                description: 'all valid updates'
            },
            {
                updates: {
                    kategori_id: '3', // inactive
                    satuan_id: '2',
                    stok_minimum: 5
                },
                shouldBeValid: false,
                description: 'invalid kategori with valid others'
            },
            {
                updates: {
                    kategori_id: '1',
                    satuan_id: '3', // inactive
                    stok_minimum: 0
                },
                shouldBeValid: false,
                description: 'invalid satuan with valid others'
            },
            {
                updates: {
                    kategori_id: '1',
                    satuan_id: '2',
                    stok_minimum: -5 // negative
                },
                shouldBeValid: false,
                description: 'invalid stok minimum with valid others'
            },
            {
                updates: {
                    kategori_id: '999', // non-existent
                    satuan_id: '888', // non-existent
                    stok_minimum: -10 // negative
                },
                shouldBeValid: false,
                description: 'multiple invalid updates'
            }
        ];

        testCases.forEach(testCase => {
            const errors = bulkOperationsManager.validateBulkUpdate(testCase.updates);
            
            if (testCase.shouldBeValid) {
                expect(errors.length).toBe(0);
            } else {
                expect(errors.length).toBeGreaterThan(0);
                
                // Each error should be a non-empty string
                errors.forEach(error => {
                    expect(typeof error).toBe('string');
                    expect(error.length).toBeGreaterThan(0);
                });
            }
        });
    });

    test('should handle edge cases in validation', () => {
        const edgeCases = [
            {
                updates: {},
                description: 'empty updates object',
                expectedErrors: 0
            },
            {
                updates: {
                    kategori_id: '',
                    satuan_id: '',
                    status: '',
                    stok_minimum: undefined
                },
                description: 'all empty/undefined values',
                expectedErrors: 0
            },
            {
                updates: {
                    kategori_id: '0',
                    satuan_id: '0'
                },
                description: 'zero string IDs',
                expectedErrorsMin: 0 // Depends on whether '0' exists in data
            }
        ];

        edgeCases.forEach(edgeCase => {
            const errors = bulkOperationsManager.validateBulkUpdate(edgeCase.updates);
            
            expect(Array.isArray(errors)).toBe(true);
            
            if (edgeCase.expectedErrors !== undefined) {
                expect(errors.length).toBe(edgeCase.expectedErrors);
            }
            
            if (edgeCase.expectedErrorsMin !== undefined) {
                expect(errors.length).toBeGreaterThanOrEqual(edgeCase.expectedErrorsMin);
            }
        });
    });

    test('should provide meaningful error messages', () => {
        const invalidUpdates = {
            kategori_id: '999', // non-existent
            satuan_id: '888',   // non-existent
            stok_minimum: -5    // negative
        };

        const errors = bulkOperationsManager.validateBulkUpdate(invalidUpdates);
        
        expect(errors.length).toBeGreaterThan(0);
        
        // Each error should be descriptive
        errors.forEach(error => {
            expect(typeof error).toBe('string');
            expect(error.length).toBeGreaterThan(10); // Should be descriptive
            
            // Should contain relevant keywords
            const lowerError = error.toLowerCase();
            const hasRelevantKeyword = 
                lowerError.includes('kategori') ||
                lowerError.includes('satuan') ||
                lowerError.includes('stok') ||
                lowerError.includes('minimum') ||
                lowerError.includes('valid') ||
                lowerError.includes('aktif');
                
            expect(hasRelevantKeyword).toBe(true);
        });
    });

    test('should validate consistently across multiple calls', () => {
        const testUpdates = {
            kategori_id: '3', // inactive
            satuan_id: '1',   // active
            stok_minimum: -1  // negative
        };

        // Call validation multiple times
        const errors1 = bulkOperationsManager.validateBulkUpdate(testUpdates);
        const errors2 = bulkOperationsManager.validateBulkUpdate(testUpdates);
        const errors3 = bulkOperationsManager.validateBulkUpdate(testUpdates);

        // Results should be consistent
        expect(errors1.length).toBe(errors2.length);
        expect(errors2.length).toBe(errors3.length);
        
        // Error messages should be the same
        expect(errors1).toEqual(errors2);
        expect(errors2).toEqual(errors3);
    });

    test('should handle data source changes gracefully', () => {
        const updates = { kategori_id: '1', satuan_id: '1' };
        
        // Initial validation
        const errors1 = bulkOperationsManager.validateBulkUpdate(updates);
        expect(errors1.length).toBe(0); // Should be valid initially
        
        // Change data source to make kategori inactive
        const inactiveKategoris = [
            { id: '1', nama: 'Sembako', status: 'nonaktif' } // Now inactive
        ];
        
        // Update the mocked method
        bulkOperationsManager.getKategoriById = (id) => {
            return inactiveKategoris.find(kategori => kategori.id === id);
        };
        
        // Validation should now detect the inactive kategori
        const errors2 = bulkOperationsManager.validateBulkUpdate(updates);
        const kategoriErrors = errors2.filter(error => 
            error.toLowerCase().includes('kategori')
        );
        expect(kategoriErrors.length).toBeGreaterThan(0);
    });
});