/**
 * Property-Based Test: Rollback Information Sufficiency
 * Feature: upload-master-barang-excel, Property 20: Rollback Information Sufficiency
 * 
 * Tests that for any import operation, the system maintains sufficient information
 * to enable complete rollback to previous state.
 * 
 * Validates: Requirements 6.5
 */

import fc from 'fast-check';
import AuditLogger from '../../js/upload-excel/AuditLogger.js';

describe('Property Test: Rollback Information Sufficiency', () => {
    let auditLogger;

    beforeEach(() => {
        localStorage.clear();
        auditLogger = new AuditLogger();
    });

    afterEach(() => {
        localStorage.clear();
    });

    // Generator for complete import session
    const importSessionArb = fc.record({
        user: fc.string({ minLength: 1, maxLength: 50 }),
        fileName: fc.string({ minLength: 1, maxLength: 100 }),
        recordCount: fc.integer({ min: 1, max: 1000 }),
        dataChanges: fc.array(fc.record({
            oldData: fc.option(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 }),
                kategori: fc.string({ minLength: 1, maxLength: 50 }),
                satuan: fc.string({ minLength: 1, maxLength: 20 }),
                harga_beli: fc.float({ min: 0.01, max: 1000000 }),
                stok: fc.integer({ min: 0, max: 10000 })
            })),
            newData: fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 }),
                kategori: fc.string({ minLength: 1, maxLength: 50 }),
                satuan: fc.string({ minLength: 1, maxLength: 20 }),
                harga_beli: fc.float({ min: 0.01, max: 1000000 }),
                stok: fc.integer({ min: 0, max: 10000 })
            })
        }), { minLength: 1, maxLength: 20 }),
        importResults: fc.record({
            totalProcessed: fc.integer({ min: 1, max: 1000 }),
            created: fc.integer({ min: 0, max: 500 }),
            updated: fc.integer({ min: 0, max: 500 }),
            failed: fc.integer({ min: 0, max: 100 }),
            duration: fc.integer({ min: 100, max: 60000 })
        })
    });

    test('should maintain sufficient information for complete rollback', () => {
        fc.assert(fc.property(
            importSessionArb,
            (session) => {
                // Act: Simulate complete import session
                const sessionId = auditLogger.logUploadStart(
                    session.user, 
                    session.fileName, 
                    session.recordCount
                );

                // Log all data changes
                session.dataChanges.forEach((change, index) => {
                    // Ensure unique kode for each change
                    change.newData.kode = `ITEM_${index}`;
                    if (change.oldData) {
                        change.oldData.kode = `ITEM_${index}`;
                    }
                    
                    auditLogger.logDataChanges(sessionId, change.oldData, change.newData);
                });

                // Log import completion
                auditLogger.logImportComplete(sessionId, session.importResults);

                // Assert: Verify rollback information sufficiency
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                
                // Should have upload start, data changes, and import complete entries
                const uploadEntry = auditTrail.find(e => e.action === 'upload_start');
                const dataChangeEntries = auditTrail.filter(e => e.action === 'data_change');
                const importCompleteEntry = auditTrail.find(e => e.action === 'import_complete');
                
                expect(uploadEntry).toBeDefined();
                expect(dataChangeEntries.length).toBe(session.dataChanges.length);
                expect(importCompleteEntry).toBeDefined();
                
                // Assert: Verify sufficient information for rollback
                // 1. Original file information for re-import
                expect(uploadEntry.details.fileName).toBe(session.fileName);
                expect(uploadEntry.details.recordCount).toBe(session.recordCount);
                
                // 2. Complete before/after data for each change
                dataChangeEntries.forEach((entry, index) => {
                    const originalChange = session.dataChanges[index];
                    expect(entry.oldData).toEqual(originalChange.oldData);
                    expect(entry.newData).toEqual(originalChange.newData);
                    expect(entry.details.changeType).toBeDefined();
                    expect(entry.details.recordId).toBeDefined();
                });
                
                // 3. Import results for verification
                expect(importCompleteEntry.details.totalRecords).toBe(session.importResults.totalProcessed);
                expect(importCompleteEntry.details.createdRecords).toBe(session.importResults.created);
                expect(importCompleteEntry.details.updatedRecords).toBe(session.importResults.updated);
                
                // 4. Timestamps for chronological reconstruction
                auditTrail.forEach(entry => {
                    expect(entry.timestamp).toBeDefined();
                    expect(() => new Date(entry.timestamp)).not.toThrow();
                });
            }
        ), { numRuns: 50 });
    });

    test('should preserve data integrity for rollback across multiple sessions', () => {
        fc.assert(fc.property(
            fc.array(importSessionArb, { minLength: 2, maxLength: 5 }),
            (sessions) => {
                const sessionIds = [];

                // Act: Log multiple import sessions
                sessions.forEach((session, sessionIndex) => {
                    const sessionId = auditLogger.logUploadStart(
                        session.user, 
                        `${session.fileName}_${sessionIndex}`, 
                        session.recordCount
                    );
                    sessionIds.push(sessionId);

                    // Log data changes with session-specific prefixes
                    session.dataChanges.forEach((change, changeIndex) => {
                        change.newData.kode = `S${sessionIndex}_ITEM_${changeIndex}`;
                        if (change.oldData) {
                            change.oldData.kode = `S${sessionIndex}_ITEM_${changeIndex}`;
                        }
                        
                        auditLogger.logDataChanges(sessionId, change.oldData, change.newData);
                    });

                    auditLogger.logImportComplete(sessionId, session.importResults);
                });

                // Assert: Verify each session has complete rollback information
                sessionIds.forEach((sessionId, sessionIndex) => {
                    const sessionAudit = auditLogger.getAuditTrail({ sessionId });
                    const originalSession = sessions[sessionIndex];
                    
                    // Verify session isolation
                    expect(sessionAudit.every(entry => entry.sessionId === sessionId)).toBe(true);
                    
                    // Verify complete data change history
                    const dataChanges = sessionAudit.filter(e => e.action === 'data_change');
                    expect(dataChanges.length).toBe(originalSession.dataChanges.length);
                    
                    // Verify data integrity
                    dataChanges.forEach(entry => {
                        expect(entry.oldData).toBeDefined();
                        expect(entry.newData).toBeDefined();
                        expect(entry.details.recordId).toMatch(new RegExp(`^S${sessionIndex}_ITEM_\\d+$`));
                    });
                });
            }
        ), { numRuns: 30 });
    });

    test('should maintain rollback information even with errors', () => {
        fc.assert(fc.property(
            importSessionArb,
            fc.array(fc.record({
                error: fc.record({
                    name: fc.constantFrom('ValidationError', 'ProcessingError'),
                    message: fc.string({ minLength: 1, maxLength: 100 })
                }),
                context: fc.record({
                    severity: fc.constantFrom('error', 'warning'),
                    recoverable: fc.boolean(),
                    rowNumber: fc.integer({ min: 1, max: 1000 })
                })
            }), { minLength: 1, maxLength: 5 }),
            (session, errors) => {
                // Act: Simulate import session with errors
                const sessionId = auditLogger.logUploadStart(
                    session.user, 
                    session.fileName, 
                    session.recordCount
                );

                // Log some successful data changes
                session.dataChanges.slice(0, 3).forEach((change, index) => {
                    change.newData.kode = `ITEM_${index}`;
                    if (change.oldData) {
                        change.oldData.kode = `ITEM_${index}`;
                    }
                    auditLogger.logDataChanges(sessionId, change.oldData, change.newData);
                });

                // Log errors
                errors.forEach(errorInfo => {
                    const error = new Error(errorInfo.error.message);
                    error.name = errorInfo.error.name;
                    auditLogger.logError(sessionId, error, errorInfo.context);
                });

                // Log partial import completion
                const partialResults = {
                    ...session.importResults,
                    failed: errors.length
                };
                auditLogger.logImportComplete(sessionId, partialResults);

                // Assert: Verify rollback information includes error context
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                
                const errorEntries = auditTrail.filter(e => e.action === 'error');
                const dataChangeEntries = auditTrail.filter(e => e.action === 'data_change');
                const importEntry = auditTrail.find(e => e.action === 'import_complete');
                
                expect(errorEntries.length).toBe(errors.length);
                expect(dataChangeEntries.length).toBe(3);
                expect(importEntry).toBeDefined();
                
                // Assert: Error information sufficient for rollback decision
                errorEntries.forEach((entry, index) => {
                    expect(entry.details.errorType).toBe(errors[index].error.name);
                    expect(entry.details.errorMessage).toBe(errors[index].error.message);
                    expect(entry.details.context.recoverable).toBe(errors[index].context.recoverable);
                });
                
                // Assert: Partial success information available
                expect(importEntry.details.failedRecords).toBe(errors.length);
                expect(importEntry.details.status).toBe('partial_success');
            }
        ), { numRuns: 30 });
    });

    test('should provide chronological reconstruction capability', () => {
        fc.assert(fc.property(
            importSessionArb,
            (session) => {
                // Act: Log session with deliberate delays
                const sessionId = auditLogger.logUploadStart(
                    session.user, 
                    session.fileName, 
                    session.recordCount
                );

                const timestamps = [];
                
                // Log changes with small delays to ensure different timestamps
                session.dataChanges.forEach((change, index) => {
                    // Small delay
                    const start = Date.now();
                    while (Date.now() - start < 2) { /* wait */ }
                    
                    change.newData.kode = `ITEM_${index}`;
                    if (change.oldData) {
                        change.oldData.kode = `ITEM_${index}`;
                    }
                    
                    auditLogger.logDataChanges(sessionId, change.oldData, change.newData);
                    timestamps.push(Date.now());
                });

                auditLogger.logImportComplete(sessionId, session.importResults);

                // Assert: Verify chronological order preservation
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                
                // Sort by timestamp (oldest first for reconstruction)
                const chronologicalOrder = [...auditTrail].sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                
                // First entry should be upload_start
                expect(chronologicalOrder[0].action).toBe('upload_start');
                
                // Last entry should be import_complete
                expect(chronologicalOrder[chronologicalOrder.length - 1].action).toBe('import_complete');
                
                // Data changes should be in between
                const dataChangeEntries = chronologicalOrder.filter(e => e.action === 'data_change');
                expect(dataChangeEntries.length).toBe(session.dataChanges.length);
                
                // Verify timestamps are sequential
                for (let i = 0; i < chronologicalOrder.length - 1; i++) {
                    const currentTime = new Date(chronologicalOrder[i].timestamp);
                    const nextTime = new Date(chronologicalOrder[i + 1].timestamp);
                    expect(currentTime.getTime()).toBeLessThanOrEqual(nextTime.getTime());
                }
            }
        ), { numRuns: 30 });
    });

    test('should maintain referential integrity for rollback operations', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 50 }), // user
            fc.string({ minLength: 1, maxLength: 100 }), // fileName
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 })
            }), { minLength: 1, maxLength: 10 }),
            (user, fileName, items) => {
                // Act: Create session with related data changes
                const sessionId = auditLogger.logUploadStart(user, fileName, items.length);

                // Log creation of items
                items.forEach((item, index) => {
                    const newData = { ...item, kode: `ITEM_${index}` };
                    auditLogger.logDataChanges(sessionId, null, newData);
                });

                // Log updates to some items
                items.slice(0, Math.ceil(items.length / 2)).forEach((item, index) => {
                    const oldData = { ...item, kode: `ITEM_${index}` };
                    const newData = { ...item, kode: `ITEM_${index}`, nama: `Updated ${item.nama}` };
                    auditLogger.logDataChanges(sessionId, oldData, newData);
                });

                const results = {
                    totalProcessed: items.length,
                    created: items.length,
                    updated: Math.ceil(items.length / 2),
                    failed: 0
                };
                auditLogger.logImportComplete(sessionId, results);

                // Assert: Verify referential integrity for rollback
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                
                // Group changes by record ID
                const changesByRecord = {};
                auditTrail.filter(e => e.action === 'data_change').forEach(entry => {
                    const recordId = entry.details.recordId;
                    if (!changesByRecord[recordId]) {
                        changesByRecord[recordId] = [];
                    }
                    changesByRecord[recordId].push(entry);
                });

                // Verify each record has complete change history
                Object.keys(changesByRecord).forEach(recordId => {
                    const changes = changesByRecord[recordId].sort((a, b) => 
                        new Date(a.timestamp) - new Date(b.timestamp)
                    );
                    
                    // First change should be creation (oldData = null)
                    expect(changes[0].oldData).toBeNull();
                    expect(changes[0].details.changeType).toBe('create');
                    
                    // Subsequent changes should have proper old/new data chain
                    for (let i = 1; i < changes.length; i++) {
                        expect(changes[i].oldData).toBeDefined();
                        expect(changes[i].details.changeType).toBe('update');
                        // Old data of current change should match new data of previous change
                        expect(changes[i].oldData).toEqual(changes[i-1].newData);
                    }
                });
            }
        ), { numRuns: 30 });
    });
});