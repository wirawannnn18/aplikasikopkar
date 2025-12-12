/**
 * Property-Based Test: Data Change Audit Trail
 * Feature: upload-master-barang-excel, Property 18: Data Change Audit Trail
 * 
 * Tests that for any data modification during import, the system logs both old and new values
 * for complete audit trail.
 * 
 * Validates: Requirements 6.2
 */

import fc from 'fast-check';
import AuditLogger from '../../js/upload-excel/AuditLogger.js';

describe('Property Test: Data Change Audit Trail', () => {
    let auditLogger;
    let sessionId;

    beforeEach(() => {
        localStorage.clear();
        auditLogger = new AuditLogger();
        sessionId = 'test_session_' + Date.now();
    });

    afterEach(() => {
        localStorage.clear();
    });

    // Generator for barang data
    const barangDataArb = fc.record({
        kode: fc.string({ minLength: 1, maxLength: 20 }),
        nama: fc.string({ minLength: 1, maxLength: 100 }),
        kategori: fc.string({ minLength: 1, maxLength: 50 }),
        satuan: fc.string({ minLength: 1, maxLength: 20 }),
        harga_beli: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000) }),
        stok: fc.integer({ min: 0, max: 10000 }),
        supplier: fc.option(fc.string({ maxLength: 100 }))
    });

    test('should log both old and new values for data updates', () => {
        fc.assert(fc.property(
            barangDataArb, // oldData
            barangDataArb, // newData
            (oldData, newData) => {
                // Ensure same kode for update scenario
                newData.kode = oldData.kode;

                // Act: Log data change
                auditLogger.logDataChanges(sessionId, oldData, newData);

                // Assert: Verify audit entry exists
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(1);

                const changeEntry = auditTrail[0];
                
                // Assert: Verify complete audit trail structure
                expect(changeEntry.action).toBe('data_change');
                expect(changeEntry.sessionId).toBe(sessionId);
                expect(changeEntry.oldData).toEqual(oldData);
                expect(changeEntry.newData).toEqual(newData);
                
                // Assert: Verify change details
                expect(changeEntry.details.changeType).toBe('update');
                expect(changeEntry.details.recordId).toBe(oldData.kode);
                expect(changeEntry.details.fieldsChanged).toBeDefined();
                expect(Array.isArray(changeEntry.details.fieldsChanged)).toBe(true);
                
                // Assert: Verify changed fields are correctly identified
                const expectedChangedFields = [];
                Object.keys(oldData).forEach(key => {
                    if (oldData[key] !== newData[key]) {
                        expectedChangedFields.push(key);
                    }
                });
                
                expect(changeEntry.details.fieldsChanged.sort()).toEqual(expectedChangedFields.sort());
            }
        ), { numRuns: 100 });
    });

    test('should log new record creation with null old data', () => {
        fc.assert(fc.property(
            barangDataArb, // newData
            (newData) => {
                // Act: Log data creation (no old data)
                auditLogger.logDataChanges(sessionId, null, newData);

                // Assert: Verify audit entry for creation
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(1);

                const changeEntry = auditTrail[0];
                
                // Assert: Verify creation audit trail
                expect(changeEntry.action).toBe('data_change');
                expect(changeEntry.oldData).toBeNull();
                expect(changeEntry.newData).toEqual(newData);
                expect(changeEntry.details.changeType).toBe('create');
                expect(changeEntry.details.recordId).toBe(newData.kode);
                
                // Assert: All fields should be marked as changed for new records
                const expectedChangedFields = Object.keys(newData);
                expect(changeEntry.details.fieldsChanged.sort()).toEqual(expectedChangedFields.sort());
            }
        ), { numRuns: 100 });
    });

    test('should preserve data integrity in audit log (deep copy)', () => {
        fc.assert(fc.property(
            barangDataArb, // originalData
            (originalData) => {
                const oldData = { ...originalData };
                const newData = { ...originalData, nama: 'Modified Name' };

                // Act: Log data change
                auditLogger.logDataChanges(sessionId, oldData, newData);

                // Modify original objects after logging
                oldData.nama = 'Tampered Old';
                newData.nama = 'Tampered New';

                // Assert: Verify audit log preserves original values
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                const changeEntry = auditTrail[0];
                
                expect(changeEntry.oldData.nama).toBe(originalData.nama);
                expect(changeEntry.newData.nama).toBe('Modified Name');
                expect(changeEntry.oldData.nama).not.toBe('Tampered Old');
                expect(changeEntry.newData.nama).not.toBe('Tampered New');
            }
        ), { numRuns: 50 });
    });

    test('should handle multiple data changes in same session', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                oldData: fc.option(barangDataArb),
                newData: barangDataArb
            }), { minLength: 2, maxLength: 10 }),
            (changes) => {
                // Act: Log multiple data changes
                changes.forEach((change, index) => {
                    // Ensure unique kode for each record
                    change.newData.kode = `ITEM_${index}`;
                    if (change.oldData) {
                        change.oldData.kode = `ITEM_${index}`;
                    }
                    
                    auditLogger.logDataChanges(sessionId, change.oldData, change.newData);
                });

                // Assert: Verify all changes are logged
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(changes.length);

                // Assert: Verify each change is properly recorded
                changes.forEach((change, index) => {
                    const changeEntry = auditTrail.find(entry => 
                        entry.details.recordId === `ITEM_${index}`
                    );
                    
                    expect(changeEntry).toBeDefined();
                    expect(changeEntry.oldData).toEqual(change.oldData);
                    expect(changeEntry.newData).toEqual(change.newData);
                });
            }
        ), { numRuns: 50 });
    });

    test('should correctly identify no changes when data is identical', () => {
        fc.assert(fc.property(
            barangDataArb, // data
            (data) => {
                const oldData = { ...data };
                const newData = { ...data };

                // Act: Log identical data
                auditLogger.logDataChanges(sessionId, oldData, newData);

                // Assert: Verify no fields marked as changed
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                const changeEntry = auditTrail[0];
                
                expect(changeEntry.details.fieldsChanged).toEqual([]);
                expect(changeEntry.details.changeType).toBe('update');
            }
        ), { numRuns: 50 });
    });

    test('should handle complex nested data structures', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                metadata: fc.record({
                    tags: fc.array(fc.string()),
                    attributes: fc.dictionary(fc.string(), fc.string())
                })
            }),
            (complexData) => {
                const oldData = JSON.parse(JSON.stringify(complexData));
                const newData = JSON.parse(JSON.stringify(complexData));
                newData.metadata.tags.push('new_tag');

                // Act: Log complex data change
                auditLogger.logDataChanges(sessionId, oldData, newData);

                // Assert: Verify complex data is properly logged
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                const changeEntry = auditTrail[0];
                
                expect(changeEntry.oldData).toEqual(oldData);
                expect(changeEntry.newData).toEqual(newData);
                expect(changeEntry.details.fieldsChanged).toContain('metadata');
            }
        ), { numRuns: 50 });
    });
});