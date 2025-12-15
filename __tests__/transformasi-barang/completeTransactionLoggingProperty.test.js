/**
 * Property Test: Complete Transaction Logging
 * Validates: Requirements 4.1
 * 
 * Property 16: Complete Transaction Logging
 * All transformation operations must be logged with complete audit trail
 */

import fc from 'fast-check';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Property Test: Complete Transaction Logging', () => {
    let auditLogger;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        
        auditLogger = new AuditLogger();
        auditLogger.initialize();
    });

    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('Property 16: All transformation operations are logged with complete audit trail', () => {
        fc.assert(fc.property(
            fc.record({
                transformations: fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        user: fc.string({ minLength: 1, maxLength: 30 }),
                        status: fc.constantFrom('completed', 'failed', 'pending'),
                        sourceItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            unit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                            quantity: fc.integer({ min: 1, max: 1000 }),
                            stockBefore: fc.integer({ min: 0, max: 10000 }),
                            stockAfter: fc.integer({ min: 0, max: 10000 }),
                            baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        targetItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            unit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                            quantity: fc.integer({ min: 1, max: 1000 }),
                            stockBefore: fc.integer({ min: 0, max: 10000 }),
                            stockAfter: fc.integer({ min: 0, max: 10000 }),
                            baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        conversionRatio: fc.integer({ min: 1, max: 100 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                events: fc.array(
                    fc.record({
                        level: fc.constantFrom('info', 'warning', 'error'),
                        message: fc.string({ minLength: 1, maxLength: 200 }),
                        context: fc.record({
                            transformationId: fc.string({ minLength: 1, maxLength: 50 }),
                            user: fc.string({ minLength: 1, maxLength: 30 })
                        })
                    }),
                    { minLength: 0, maxLength: 10 }
                )
            }),
            async ({ transformations, events }) => {
                // Make transformation IDs unique and ensure same base product
                const uniqueTransformations = transformations.map((t, index) => ({
                    ...t,
                    id: `${t.id}_${index}`,
                    targetItem: {
                        ...t.targetItem,
                        baseProduct: t.sourceItem.baseProduct
                    }
                }));

                // Log all transformations
                const loggedTransformationIds = [];
                for (const transformation of uniqueTransformations) {
                    const logId = await auditLogger.logTransformation(transformation);
                    loggedTransformationIds.push(logId);
                    expect(logId).toBeDefined();
                    expect(typeof logId).toBe('string');
                }

                // Log all events
                const loggedEventIds = [];
                for (const event of events) {
                    const logId = await auditLogger.logEvent(event.level, event.message, event.context);
                    loggedEventIds.push(logId);
                    expect(logId).toBe(true); // logEvent returns boolean
                }

                // Verify complete audit trail exists
                const history = await auditLogger.getTransformationHistory();
                
                // All transformations should be in history
                expect(history.data.length).toBe(uniqueTransformations.length);
                
                // Verify each transformation is logged completely
                for (const transformation of uniqueTransformations) {
                    const loggedTransformation = await auditLogger.getTransformationLog(transformation.id);
                    
                    expect(loggedTransformation).toBeDefined();
                    expect(loggedTransformation.type).toBe('transformation');
                    
                    // Verify audit trail completeness
                    expect(loggedTransformation.id).toBeDefined();
                    expect(loggedTransformation.timestamp).toBeDefined();
                    expect(loggedTransformation.transformationId).toBe(transformation.id);
                    expect(loggedTransformation.user).toBe(transformation.user);
                    expect(loggedTransformation.status).toBe(transformation.status);
                    
                    // Verify complete source item audit trail
                    expect(loggedTransformation.sourceItem).toEqual({
                        id: transformation.sourceItem.id,
                        name: transformation.sourceItem.name,
                        unit: transformation.sourceItem.unit,
                        quantity: transformation.sourceItem.quantity,
                        stockBefore: transformation.sourceItem.stockBefore,
                        stockAfter: transformation.sourceItem.stockAfter,
                        baseProduct: transformation.sourceItem.baseProduct
                    });
                    
                    // Verify complete target item audit trail
                    expect(loggedTransformation.targetItem).toEqual({
                        id: transformation.targetItem.id,
                        name: transformation.targetItem.name,
                        unit: transformation.targetItem.unit,
                        quantity: transformation.targetItem.quantity,
                        stockBefore: transformation.targetItem.stockBefore,
                        stockAfter: transformation.targetItem.stockAfter,
                        baseProduct: transformation.targetItem.baseProduct
                    });
                    
                    // Verify conversion ratio is logged
                    expect(loggedTransformation.conversionRatio).toBe(transformation.conversionRatio);
                    
                    // Verify metadata completeness
                    expect(loggedTransformation.metadata).toBeDefined();
                    expect(loggedTransformation.metadata.baseProduct).toBe(transformation.sourceItem.baseProduct);
                    expect(loggedTransformation.metadata.transformationType).toBe(
                        `${transformation.sourceItem.unit}_to_${transformation.targetItem.unit}`
                    );
                    expect(loggedTransformation.metadata.totalValueChange).toBeDefined();
                }

                // Verify audit trail integrity (no missing entries)
                const allLogs = auditLogger._getAllLogs();
                const transformationLogs = allLogs.filter(log => log.type === 'transformation');
                const eventLogs = allLogs.filter(log => log.type === 'event');
                
                expect(transformationLogs.length).toBe(uniqueTransformations.length);
                expect(eventLogs.length).toBe(events.length);
                
                // Verify chronological ordering
                const timestamps = transformationLogs.map(log => new Date(log.timestamp).getTime());
                for (let i = 1; i < timestamps.length; i++) {
                    expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i-1]);
                }
            }
        ), { numRuns: 25 });
    });

    test('Property 16.1: Audit trail maintains data integrity across operations', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 50 }),
                    user: fc.string({ minLength: 1, maxLength: 30 }),
                    status: fc.constantFrom('completed', 'failed'),
                    sourceItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }),
                        unit: fc.constantFrom('PCS', 'DUS'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 10, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    targetItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }),
                        unit: fc.constantFrom('PCS', 'DUS'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    conversionRatio: fc.float({ min: 1, max: 50, noNaN: true })
                }),
                { minLength: 2, maxLength: 15 }
            ),
            async (transformations) => {
                // Make IDs unique and ensure same base product
                const uniqueTransformations = transformations.map((t, index) => ({
                    ...t,
                    id: `${t.id}_${index}`,
                    targetItem: {
                        ...t.targetItem,
                        baseProduct: t.sourceItem.baseProduct
                    }
                }));

                // Log transformations in sequence
                const originalData = [];
                for (const transformation of uniqueTransformations) {
                    // Store original data for integrity check
                    originalData.push(JSON.parse(JSON.stringify(transformation)));
                    
                    await auditLogger.logTransformation(transformation);
                }

                // Verify data integrity - logged data should match original
                for (let i = 0; i < uniqueTransformations.length; i++) {
                    const original = originalData[i];
                    const logged = await auditLogger.getTransformationLog(original.id);
                    
                    expect(logged).toBeDefined();
                    
                    // Verify no data corruption occurred
                    expect(logged.transformationId).toBe(original.id);
                    expect(logged.user).toBe(original.user);
                    expect(logged.status).toBe(original.status);
                    expect(logged.conversionRatio).toBe(original.conversionRatio);
                    
                    // Verify source item integrity
                    expect(logged.sourceItem.id).toBe(original.sourceItem.id);
                    expect(logged.sourceItem.name).toBe(original.sourceItem.name);
                    expect(logged.sourceItem.unit).toBe(original.sourceItem.unit);
                    expect(logged.sourceItem.quantity).toBe(original.sourceItem.quantity);
                    expect(logged.sourceItem.stockBefore).toBe(original.sourceItem.stockBefore);
                    expect(logged.sourceItem.stockAfter).toBe(original.sourceItem.stockAfter);
                    
                    // Verify target item integrity
                    expect(logged.targetItem.id).toBe(original.targetItem.id);
                    expect(logged.targetItem.name).toBe(original.targetItem.name);
                    expect(logged.targetItem.unit).toBe(original.targetItem.unit);
                    expect(logged.targetItem.quantity).toBe(original.targetItem.quantity);
                    expect(logged.targetItem.stockBefore).toBe(original.targetItem.stockBefore);
                    expect(logged.targetItem.stockAfter).toBe(original.targetItem.stockAfter);
                }

                // Verify complete audit trail exists
                const history = await auditLogger.getTransformationHistory();
                expect(history.data.length).toBe(uniqueTransformations.length);
                
                // Verify all transformations are accounted for
                const loggedIds = history.data.map(log => log.transformationId);
                const originalIds = uniqueTransformations.map(t => t.id);
                
                originalIds.forEach(id => {
                    expect(loggedIds).toContain(id);
                });
            }
        ), { numRuns: 20 });
    });

    test('Property 16.2: Audit trail survives system operations', () => {
        fc.assert(fc.property(
            fc.record({
                transformations: fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        user: fc.string({ minLength: 1, maxLength: 30 }),
                        status: fc.constantFrom('completed', 'failed'),
                        sourceItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            unit: fc.constantFrom('PCS', 'DUS'),
                            quantity: fc.integer({ min: 1, max: 100 }),
                            stockBefore: fc.integer({ min: 10, max: 1000 }),
                            stockAfter: fc.integer({ min: 0, max: 1000 }),
                            baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        targetItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            unit: fc.constantFrom('PCS', 'DUS'),
                            quantity: fc.integer({ min: 1, max: 100 }),
                            stockBefore: fc.integer({ min: 0, max: 1000 }),
                            stockAfter: fc.integer({ min: 0, max: 1000 }),
                            baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        conversionRatio: fc.integer({ min: 1, max: 50 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                retentionDays: fc.integer({ min: 1, max: 365 })
            }),
            async ({ transformations, retentionDays }) => {
                // Make IDs unique and ensure same base product
                const uniqueTransformations = transformations.map((t, index) => ({
                    ...t,
                    id: `${t.id}_${index}`,
                    targetItem: {
                        ...t.targetItem,
                        baseProduct: t.sourceItem.baseProduct
                    }
                }));

                // Log all transformations
                for (const transformation of uniqueTransformations) {
                    await auditLogger.logTransformation(transformation);
                }

                // Verify initial state
                const initialHistory = await auditLogger.getTransformationHistory();
                expect(initialHistory.data.length).toBe(uniqueTransformations.length);

                // Simulate system operations
                
                // 1. Create new AuditLogger instance (simulates system restart)
                const newAuditLogger = new AuditLogger();
                newAuditLogger.initialize();
                
                // Verify audit trail survives reinitialization
                const historyAfterRestart = await newAuditLogger.getTransformationHistory();
                expect(historyAfterRestart.data.length).toBe(uniqueTransformations.length);
                
                // 2. Test cleanup operation (only if retention period allows)
                const currentDate = new Date();
                const oldestLogDate = new Date(Math.min(...historyAfterRestart.data.map(log => new Date(log.timestamp))));
                const daysDifference = Math.floor((currentDate - oldestLogDate) / (1000 * 60 * 60 * 24));
                
                if (daysDifference < retentionDays) {
                    // All logs should survive cleanup
                    const deletedCount = await newAuditLogger.cleanupOldLogs(retentionDays);
                    expect(deletedCount).toBe(0);
                    
                    const historyAfterCleanup = await newAuditLogger.getTransformationHistory();
                    expect(historyAfterCleanup.data.length).toBe(uniqueTransformations.length);
                }

                // 3. Verify data integrity after all operations
                for (const transformation of uniqueTransformations) {
                    const loggedTransformation = await newAuditLogger.getTransformationLog(transformation.id);
                    expect(loggedTransformation).toBeDefined();
                    expect(loggedTransformation.transformationId).toBe(transformation.id);
                    expect(loggedTransformation.user).toBe(transformation.user);
                    expect(loggedTransformation.status).toBe(transformation.status);
                }

                // 4. Verify statistics are consistent
                const stats = await newAuditLogger.getTransformationStatistics();
                expect(stats.totalTransformations).toBeGreaterThan(0);
                expect(stats.successfulTransformations + stats.failedTransformations).toBe(stats.totalTransformations);
            }
        ), { numRuns: 15 });
    });
});
