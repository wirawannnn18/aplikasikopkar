/**
 * Property Test 27: Category/Unit Status Validation
 * Validates: Requirements 7.4 - Category/unit status validation
 */

import fc from 'fast-check';

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: function(key) {
        return this.store[key] || null;
    },
    setItem: function(key, value) {
        this.store[key] = value;
    },
    clear: function() {
        this.store = {};
    }
};

global.localStorage = localStorageMock;

// Mock window object
global.window = {
    auditLogger: {
        logActivity: function() {}
    }
};

import AdvancedFeatureManager from '../../js/master-barang/AdvancedFeatureManager.js';

describe('Property Test 27: Category/Unit Status Validation', () => {
    let manager;

    beforeEach(() => {
        manager = new AdvancedFeatureManager();
        localStorageMock.clear();
        
        // Setup test categories with different statuses
        localStorage.setItem('master_barang_categories', JSON.stringify([
            { id: '1', nama: 'Elektronik', status: 'active' },
            { id: '2', nama: 'Makanan', status: 'inactive' },
            { id: '3', nama: 'Pakaian', status: 'deprecated' },
            { id: '4', nama: 'Furniture', status: 'active' }
        ]));
        
        // Setup test units with different statuses
        localStorage.setItem('master_barang_satuan', JSON.stringify([
            { id: '1', nama: 'Pcs', status: 'active' },
            { id: '2', nama: 'Kg', status: 'inactive' },
            { id: '3', nama: 'Liter', status: 'deprecated' },
            { id: '4', nama: 'Meter', status: 'active' }
        ]));
    });

    test('Property 27.1: Active entities are validated as usable', () => {
        return fc.assert(fc.property(
            fc.oneof(fc.constant('category'), fc.constant('unit')),
            fc.oneof(fc.constant('1'), fc.constant('4')), // Active entity IDs
            (entityType, entityId) => {
                const result = manager.validateEntityStatus(entityType, entityId);

                // Property: Active entities should be valid and usable
                expect(result.isValid).toBe(true);
                expect(result.status).toBe('active');
                expect(result.canProceed).toBe(true);
                expect(result.warning).toBeUndefined();
                expect(result.entity).toBeDefined();
                expect(result.entity.status).toBe('active');
                expect(result.message).toContain('active and valid');
            }
        ), { numRuns: 20 });
    });

    test('Property 27.2: Inactive entities are validated as unusable', () => {
        return fc.assert(fc.property(
            fc.oneof(fc.constant('category'), fc.constant('unit')),
            fc.constant('2'), // Inactive entity ID
            (entityType, entityId) => {
                const result = manager.validateEntityStatus(entityType, entityId);

                // Property: Inactive entities should be invalid and unusable
                expect(result.isValid).toBe(false);
                expect(result.status).toBe('inactive');
                expect(result.canProceed).toBe(false);
                expect(result.entity).toBeDefined();
                expect(result.entity.status).toBe('inactive');
                expect(result.message).toContain('inactive and cannot be used');
            }
        ), { numRuns: 10 });
    });

    test('Property 27.3: Deprecated entities are validated with warnings', () => {
        return fc.assert(fc.property(
            fc.oneof(fc.constant('category'), fc.constant('unit')),
            fc.constant('3'), // Deprecated entity ID
            (entityType, entityId) => {
                const result = manager.validateEntityStatus(entityType, entityId);

                // Property: Deprecated entities should be valid but with warnings
                expect(result.isValid).toBe(true);
                expect(result.status).toBe('deprecated');
                expect(result.canProceed).toBe(true);
                expect(result.warning).toBe(true);
                expect(result.entity).toBeDefined();
                expect(result.entity.status).toBe('deprecated');
                expect(result.message).toContain('deprecated');
                expect(result.message).toContain('consider using alternative');
            }
        ), { numRuns: 10 });
    });

    test('Property 27.4: Non-existent entities are handled correctly', () => {
        return fc.assert(fc.property(
            fc.oneof(fc.constant('category'), fc.constant('unit')),
            fc.string({ minLength: 1, maxLength: 10 }).filter(id => !['1', '2', '3', '4'].includes(id)),
            (entityType, entityId) => {
                const result = manager.validateEntityStatus(entityType, entityId);

                // Property: Non-existent entities should be invalid
                expect(result.isValid).toBe(false);
                expect(result.status).toBe('not_found');
                expect(result.canProceed).toBe(false);
                expect(result.entity).toBeUndefined();
                expect(result.message).toContain('not found');
            }
        ), { numRuns: 20 });
    });

    test('Property 27.5: Validation is consistent across multiple calls', () => {
        return fc.assert(fc.property(
            fc.oneof(fc.constant('category'), fc.constant('unit')),
            fc.oneof(fc.constant('1'), fc.constant('2'), fc.constant('3'), fc.constant('4')),
            (entityType, entityId) => {
                // Call validation multiple times
                const result1 = manager.validateEntityStatus(entityType, entityId);
                const result2 = manager.validateEntityStatus(entityType, entityId);
                const result3 = manager.validateEntityStatus(entityType, entityId);

                // Property: Results should be consistent across calls
                expect(result1.isValid).toBe(result2.isValid);
                expect(result1.isValid).toBe(result3.isValid);
                expect(result1.status).toBe(result2.status);
                expect(result1.status).toBe(result3.status);
                expect(result1.canProceed).toBe(result2.canProceed);
                expect(result1.canProceed).toBe(result3.canProceed);
                expect(result1.message).toBe(result2.message);
                expect(result1.message).toBe(result3.message);
            }
        ), { numRuns: 30 });
    });

    test('Property 27.6: Validation handles edge cases gracefully', () => {
        return fc.assert(fc.property(
            fc.oneof(
                fc.constant('category'),
                fc.constant('unit'),
                fc.constant('invalid_type'),
                fc.constant(''),
                fc.constant(null)
            ),
            fc.oneof(
                fc.constant('1'),
                fc.constant(''),
                fc.constant(null),
                fc.constant(undefined)
            ),
            (entityType, entityId) => {
                let result;
                
                // Property: Should not throw errors for invalid inputs
                expect(() => {
                    result = manager.validateEntityStatus(entityType, entityId);
                }).not.toThrow();

                // Property: Should always return a result object
                expect(result).toBeDefined();
                expect(typeof result).toBe('object');
                expect(result).toHaveProperty('isValid');
                expect(result).toHaveProperty('status');
                expect(result).toHaveProperty('canProceed');
                expect(result).toHaveProperty('message');

                // Property: Invalid inputs should result in invalid status
                if (!entityType || !entityId || !['category', 'unit'].includes(entityType)) {
                    expect(result.isValid).toBe(false);
                    expect(result.canProceed).toBe(false);
                }
            }
        ), { numRuns: 50 });
    });

    test('Property 27.7: Status validation works for both categories and units', () => {
        return fc.assert(fc.property(
            fc.constantFrom('1', '2', '3', '4'), // Valid entity IDs
            (entityId) => {
                const categoryResult = manager.validateEntityStatus('category', entityId);
                const unitResult = manager.validateEntityStatus('unit', entityId);

                // Property: Both category and unit validation should work
                expect(categoryResult).toBeDefined();
                expect(unitResult).toBeDefined();

                // Property: Results should have consistent structure
                [categoryResult, unitResult].forEach(result => {
                    expect(result).toHaveProperty('isValid');
                    expect(result).toHaveProperty('status');
                    expect(result).toHaveProperty('canProceed');
                    expect(result).toHaveProperty('message');
                    expect(typeof result.isValid).toBe('boolean');
                    expect(typeof result.canProceed).toBe('boolean');
                    expect(typeof result.message).toBe('string');
                });

                // Property: Status should match entity's actual status
                if (categoryResult.entity) {
                    expect(categoryResult.status).toBe(categoryResult.entity.status);
                }
                if (unitResult.entity) {
                    expect(unitResult.status).toBe(unitResult.entity.status);
                }
            }
        ), { numRuns: 20 });
    });

    test('Property 27.8: Validation provides appropriate guidance', () => {
        return fc.assert(fc.property(
            fc.oneof(fc.constant('category'), fc.constant('unit')),
            fc.constantFrom('1', '2', '3', '4'),
            (entityType, entityId) => {
                const result = manager.validateEntityStatus(entityType, entityId);

                // Property: Message should be informative and appropriate
                expect(result.message).toBeTruthy();
                expect(typeof result.message).toBe('string');
                expect(result.message.length).toBeGreaterThan(0);

                // Property: Message should match the status
                if (result.status === 'active') {
                    expect(result.message).toContain('active');
                    expect(result.message).toContain('valid');
                } else if (result.status === 'inactive') {
                    expect(result.message).toContain('inactive');
                    expect(result.message).toContain('cannot be used');
                } else if (result.status === 'deprecated') {
                    expect(result.message).toContain('deprecated');
                    expect(result.message).toContain('alternative');
                } else if (result.status === 'not_found') {
                    expect(result.message).toContain('not found');
                }

                // Property: canProceed should align with the guidance
                if (result.status === 'active' || result.status === 'deprecated') {
                    expect(result.canProceed).toBe(true);
                } else {
                    expect(result.canProceed).toBe(false);
                }
            }
        ), { numRuns: 30 });
    });
});