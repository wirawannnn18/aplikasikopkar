/**
 * Property-Based Tests for Search Functionality Accuracy
 * Tests Property 12: Search functionality accuracy
 * Validates: Requirements 4.2
 */

import fc from 'fast-check';
import { SearchEngine } from '../../js/master-barang/SearchEngine.js';
import { masterBarangSystem } from '../../js/master-barang/MasterBarangSystem.js';

describe('Property 12: Search Functionality Accuracy', () => {
    let searchEngine;
    let testData;

    beforeEach(() => {
        searchEngine = new SearchEngine();
        masterBarangSystem.clearAllData();
        
        // Create test data with known values
        testData = [
            {
                id: '1',
                kode: 'BRG001',
                nama: 'Laptop Gaming ASUS',
                kategori_id: 'kat1',
                kategori_nama: 'Elektronik',
                satuan_id: 'sat1',
                satuan_nama: 'PCS',
                deskripsi: 'Laptop gaming untuk professional',
                status: 'aktif'
            },
            {
                id: '2',
                kode: 'BRG002',
                nama: 'Mouse Wireless Logitech',
                kategori_id: 'kat1',
                kategori_nama: 'Elektronik',
                satuan_id: 'sat1',
                satuan_nama: 'PCS',
                deskripsi: 'Mouse wireless untuk office',
                status: 'aktif'
            },
            {
                id: '3',
                kode: 'BRG003',
                nama: 'Kertas A4 HVS',
                kategori_id: 'kat2',
                kategori_nama: 'Alat Tulis',
                satuan_id: 'sat2',
                satuan_nama: 'RIM',
                deskripsi: 'Kertas putih untuk printing',
                status: 'aktif'
            }
        ];
    });

    afterEach(() => {
        masterBarangSystem.clearAllData();
    });

    // Property 12.1: Search should return items that match the search term in specified fields
    test('should return items that match search term in kode, nama, or kategori fields', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constantFrom('BRG', 'Laptop', 'Mouse', 'Elektronik', 'Alat'),
                fc.string({ minLength: 2, maxLength: 10 }).filter(s => /^[A-Za-z0-9\s]+$/.test(s))
            ),
            (searchTerm) => {
                const results = searchEngine.search(testData, searchTerm);
                
                // All results should contain the search term in at least one searchable field
                results.forEach(item => {
                    const searchFields = ['kode', 'nama', 'kategori_nama', 'satuan_nama', 'deskripsi'];
                    const normalizedTerm = searchTerm.toLowerCase().trim();
                    
                    const hasMatch = searchFields.some(field => {
                        const fieldValue = item[field];
                        return fieldValue && fieldValue.toLowerCase().includes(normalizedTerm);
                    });
                    
                    expect(hasMatch).toBe(true);
                });
                
                // Results should be a subset of original data
                expect(results.length).toBeLessThanOrEqual(testData.length);
                
                // All returned items should exist in original data
                results.forEach(result => {
                    expect(testData.some(item => item.id === result.id)).toBe(true);
                });
            }
        ), { numRuns: 50 });
    });

    // Property 12.2: Empty search should return all data
    test('should return all data when search term is empty', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(''),
                fc.constant('   '), // whitespace only
                fc.constant('\t\n'), // tabs and newlines
                fc.constant(null),
                fc.constant(undefined)
            ),
            (emptySearchTerm) => {
                const results = searchEngine.search(testData, emptySearchTerm);
                
                expect(results).toEqual(testData);
                expect(results.length).toBe(testData.length);
            }
        ), { numRuns: 20 });
    });

    // Property 12.3: Search should be case-insensitive by default
    test('should perform case-insensitive search by default', () => {
        fc.assert(fc.property(
            fc.constantFrom('laptop', 'LAPTOP', 'Laptop', 'LaPtOp', 'elektronik', 'ELEKTRONIK'),
            (searchTerm) => {
                const results = searchEngine.search(testData, searchTerm);
                
                // Should find items regardless of case
                expect(results.length).toBeGreaterThan(0);
                
                // Verify that case variations return same results
                const lowerResults = searchEngine.search(testData, searchTerm.toLowerCase());
                const upperResults = searchEngine.search(testData, searchTerm.toUpperCase());
                
                expect(results.length).toBe(lowerResults.length);
                expect(results.length).toBe(upperResults.length);
                
                // Results should have same IDs
                const resultIds = results.map(r => r.id).sort();
                const lowerIds = lowerResults.map(r => r.id).sort();
                const upperIds = upperResults.map(r => r.id).sort();
                
                expect(resultIds).toEqual(lowerIds);
                expect(resultIds).toEqual(upperIds);
            }
        ), { numRuns: 30 });
    });

    // Property 12.4: Search should handle partial matches
    test('should return results for partial matches', () => {
        fc.assert(fc.property(
            fc.constantFrom('BRG', 'Lap', 'Mou', 'Elek', 'Ker'),
            (partialTerm) => {
                const results = searchEngine.search(testData, partialTerm);
                
                // Should find items with partial matches
                results.forEach(item => {
                    const searchFields = ['kode', 'nama', 'kategori_nama', 'satuan_nama', 'deskripsi'];
                    const normalizedTerm = partialTerm.toLowerCase();
                    
                    const hasPartialMatch = searchFields.some(field => {
                        const fieldValue = item[field];
                        return fieldValue && fieldValue.toLowerCase().includes(normalizedTerm);
                    });
                    
                    expect(hasPartialMatch).toBe(true);
                });
            }
        ), { numRuns: 30 });
    });

    // Property 12.5: Search should normalize whitespace
    test('should normalize whitespace in search terms', () => {
        fc.assert(fc.property(
            fc.constantFrom(
                'Laptop Gaming',
                '  Laptop   Gaming  ',
                '\tLaptop\tGaming\t',
                'Laptop\nGaming',
                'Laptop     Gaming'
            ),
            (searchTerm) => {
                const results = searchEngine.search(testData, searchTerm);
                const normalizedResults = searchEngine.search(testData, 'Laptop Gaming');
                
                // Should return same results regardless of whitespace variations
                expect(results.length).toBe(normalizedResults.length);
                
                const resultIds = results.map(r => r.id).sort();
                const normalizedIds = normalizedResults.map(r => r.id).sort();
                expect(resultIds).toEqual(normalizedIds);
            }
        ), { numRuns: 20 });
    });

    // Property 12.6: Search should work across multiple fields
    test('should search across multiple specified fields', () => {
        fc.assert(fc.property(
            fc.record({
                searchTerm: fc.constantFrom('BRG001', 'Laptop', 'Elektronik', 'PCS', 'gaming'),
                expectedField: fc.constantFrom('kode', 'nama', 'kategori_nama', 'satuan_nama', 'deskripsi')
            }),
            ({ searchTerm, expectedField }) => {
                const results = searchEngine.search(testData, searchTerm);
                
                if (results.length > 0) {
                    // At least one result should match in the expected field
                    const hasMatchInExpectedField = results.some(item => {
                        const fieldValue = item[expectedField];
                        return fieldValue && fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                    
                    // If the search term exists in any item's expected field, we should find it
                    const termExistsInField = testData.some(item => {
                        const fieldValue = item[expectedField];
                        return fieldValue && fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                    
                    if (termExistsInField) {
                        expect(hasMatchInExpectedField).toBe(true);
                    }
                }
            }
        ), { numRuns: 50 });
    });

    // Property 12.7: Search results should maintain data integrity
    test('should maintain data integrity in search results', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 20 }),
            (searchTerm) => {
                const results = searchEngine.search(testData, searchTerm);
                
                results.forEach(result => {
                    // Each result should have all required fields
                    expect(result).toHaveProperty('id');
                    expect(result).toHaveProperty('kode');
                    expect(result).toHaveProperty('nama');
                    expect(result).toHaveProperty('kategori_nama');
                    expect(result).toHaveProperty('satuan_nama');
                    
                    // Data should not be modified
                    const originalItem = testData.find(item => item.id === result.id);
                    expect(originalItem).toBeDefined();
                    expect(result.kode).toBe(originalItem.kode);
                    expect(result.nama).toBe(originalItem.nama);
                    expect(result.kategori_nama).toBe(originalItem.kategori_nama);
                });
            }
        ), { numRuns: 30 });
    });

    // Property 12.8: Search should handle special characters safely
    test('should handle special characters in search terms safely', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constantFrom('A4', 'HVS', 'A-4', 'A/4', 'A.4'),
                fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Za-z0-9\-\.\/\s]+$/.test(s))
            ),
            (searchTerm) => {
                // Should not throw errors with special characters
                expect(() => {
                    const results = searchEngine.search(testData, searchTerm);
                    expect(Array.isArray(results)).toBe(true);
                }).not.toThrow();
            }
        ), { numRuns: 30 });
    });

    // Property 12.9: Search performance should be consistent
    test('should perform search operations efficiently', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 50 }),
            (searchTerm) => {
                const startTime = performance.now();
                const results = searchEngine.search(testData, searchTerm);
                const endTime = performance.now();
                
                const executionTime = endTime - startTime;
                
                // Search should complete within reasonable time (100ms for small dataset)
                expect(executionTime).toBeLessThan(100);
                
                // Results should be valid
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBeLessThanOrEqual(testData.length);
            }
        ), { numRuns: 20 });
    });

    // Property 12.10: Advanced search should respect field restrictions
    test('should respect field restrictions in advanced search', () => {
        // Test with specific combinations that we know should work
        const testCases = [
            { searchTerm: 'BRG001', fields: ['kode'] }, // Should find item 1
            { searchTerm: 'Laptop', fields: ['nama'] }, // Should find item 1
            { searchTerm: 'Elektronik', fields: ['kategori_nama'] }, // Should find items 1 and 2
            { searchTerm: 'Gaming', fields: ['nama', 'deskripsi'] }, // Should find item 1
        ];

        testCases.forEach(({ searchTerm, fields }) => {
            const results = searchEngine.advancedSearch(testData, {
                searchTerm,
                fields
            });
            
            // All results should match in the specified fields only
            results.forEach(item => {
                const normalizedTerm = searchTerm.toLowerCase();
                
                const hasMatchInSpecifiedFields = fields.some(field => {
                    const fieldValue = item[field];
                    return fieldValue && fieldValue.toLowerCase().includes(normalizedTerm);
                });
                
                expect(hasMatchInSpecifiedFields).toBe(true);
            });
            
            // Verify we get expected results
            const expectedCount = testData.filter(item => {
                return fields.some(field => {
                    const fieldValue = item[field];
                    return fieldValue && fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
                });
            }).length;
            
            expect(results.length).toBe(expectedCount);
        });
    });

    // Property 12.11: Search with highlighting should preserve search accuracy
    test('should maintain search accuracy when using highlighting', () => {
        fc.assert(fc.property(
            fc.constantFrom('Laptop', 'BRG', 'Elektronik', 'Mouse'),
            (searchTerm) => {
                const normalResults = searchEngine.search(testData, searchTerm);
                const highlightResults = searchEngine.searchWithHighlight(testData, searchTerm);
                
                // Should return same number of results
                expect(highlightResults.length).toBe(normalResults.length);
                
                // Should have same items (ignoring highlights)
                const normalIds = normalResults.map(r => r.id).sort();
                const highlightIds = highlightResults.map(r => r.id).sort();
                expect(highlightIds).toEqual(normalIds);
                
                // Highlighted results should have _highlights property
                highlightResults.forEach(result => {
                    expect(result).toHaveProperty('_highlights');
                    expect(typeof result._highlights).toBe('object');
                });
            }
        ), { numRuns: 30 });
    });

    // Property 12.12: Search suggestions should be relevant
    test('should provide relevant search suggestions', () => {
        fc.assert(fc.property(
            fc.constantFrom('Lap', 'Mou', 'Ker', 'BR', 'El'),
            (partialTerm) => {
                const suggestions = searchEngine.getSuggestions(testData, partialTerm);
                
                // All suggestions should contain the partial term
                suggestions.forEach(suggestion => {
                    expect(suggestion.toLowerCase()).toContain(partialTerm.toLowerCase());
                });
                
                // Suggestions should be strings
                suggestions.forEach(suggestion => {
                    expect(typeof suggestion).toBe('string');
                    expect(suggestion.length).toBeGreaterThan(0);
                });
                
                // Should not exceed maximum suggestions
                expect(suggestions.length).toBeLessThanOrEqual(5);
            }
        ), { numRuns: 20 });
    });
});