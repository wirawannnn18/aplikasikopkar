/**
 * Test untuk AuditLogger sistem transformasi barang
 * 
 * Test ini memverifikasi bahwa AuditLogger berfungsi dengan benar
 * untuk mencatat dan mengelola audit trail transformasi.
 */

// Import dependencies untuk testing
import fc from 'fast-check';

// Mock localStorage untuk testing
const localStorageMock = {
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

// Setup global localStorage mock
global.localStorage = localStorageMock;

// Import komponen yang akan ditest
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';
import { TransformationRecord, TransformationItem } from '../../js/transformasi-barang/DataModels.js';

describe('Transformasi Barang - AuditLogger Tests', () => {
    let auditLogger;

    beforeEach(() => {
        // Clear localStorage dan buat instance baru
        localStorage.clear();
        auditLogger = new AuditLogger();
        auditLogger.initialize();
    });

    // Helper function untuk membuat sample transformation record
    function createSampleTransformationRecord(overrides = {}) {
        const sourceItem = new TransformationItem({
            id: 'AQUA-DUS',
            name: 'Aqua 1L DUS',
            unit: 'dus',
            quantity: 1,
            stockBefore: 10,
            stockAfter: 9,
            baseProduct: 'AQUA-1L'
        });

        const targetItem = new TransformationItem({
            id: 'AQUA-PCS',
            name: 'Aqua 1L PCS',
            unit: 'pcs',
            quantity: 12,
            stockBefore: 50,
            stockAfter: 62,
            baseProduct: 'AQUA-1L'
        });

        return new TransformationRecord({
            user: 'kasir01',
            sourceItem,
            targetItem,
            conversionRatio: 12,
            status: 'completed',
            ...overrides
        });
    }

    describe('Basic Functionality', () => {
        test('should initialize correctly', () => {
            expect(auditLogger.initialized).toBe(true);
            expect(Array.isArray(auditLogger.logCache)).toBe(true);
        });

        test('should log transformation successfully', async () => {
            const transformationRecord = createSampleTransformationRecord();
            
            const result = await auditLogger.logTransformation(transformationRecord);
            expect(result).toBe(true);
            
            // Verify log was saved
            const history = await auditLogger.getTransformationHistory();
            expect(history.data).toHaveLength(1);
            expect(history.data[0].transformationId).toBe(transformationRecord.id);
            expect(history.data[0].user).toBe('kasir01');
            expect(history.data[0].status).toBe('completed');
        });

        test('should log events correctly', async () => {
            const result = await auditLogger.logEvent('info', 'Test message', { test: true });
            expect(result).toBe(true);
            
            // Verify event was logged
            expect(auditLogger.logCache.length).toBeGreaterThan(0);
            const lastLog = auditLogger.logCache[auditLogger.logCache.length - 1];
            expect(lastLog.level).toBe('info');
            expect(lastLog.message).toBe('Test message');
            expect(lastLog.context.test).toBe(true);
        });

        test('should handle invalid transformation record', async () => {
            await expect(auditLogger.logTransformation(null))
                .rejects.toThrow('Transformation record harus disediakan');
        });
    });

    describe('History and Filtering', () => {
        beforeEach(async () => {
            // Setup multiple transformation records
            const records = [
                createSampleTransformationRecord({ 
                    user: 'kasir01', 
                    status: 'completed' 
                }),
                createSampleTransformationRecord({ 
                    user: 'kasir02', 
                    status: 'failed' 
                }),
                createSampleTransformationRecord({ 
                    user: 'kasir01', 
                    status: 'completed' 
                })
            ];

            for (const record of records) {
                await auditLogger.logTransformation(record);
                // Add small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        });

        test('should get all transformation history', async () => {
            const history = await auditLogger.getTransformationHistory();
            
            expect(history.data).toHaveLength(3);
            expect(history.metadata.totalCount).toBe(3);
            expect(history.metadata.hasMore).toBe(false);
        });

        test('should filter by user', async () => {
            const history = await auditLogger.getTransformationHistory({ user: 'kasir01' });
            
            expect(history.data).toHaveLength(2);
            history.data.forEach(log => {
                expect(log.user).toBe('kasir01');
            });
        });

        test('should filter by status', async () => {
            const history = await auditLogger.getTransformationHistory({ status: 'failed' });
            
            expect(history.data).toHaveLength(1);
            expect(history.data[0].status).toBe('failed');
        });

        test('should filter by date range', async () => {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            
            const history = await auditLogger.getTransformationHistory({
                dateFrom: oneHourAgo.toISOString(),
                dateTo: now.toISOString()
            });
            
            expect(history.data.length).toBeGreaterThan(0);
        });

        test('should support pagination', async () => {
            const page1 = await auditLogger.getTransformationHistory({ limit: 2, offset: 0 });
            const page2 = await auditLogger.getTransformationHistory({ limit: 2, offset: 2 });
            
            expect(page1.data).toHaveLength(2);
            expect(page1.metadata.hasMore).toBe(true);
            expect(page2.data).toHaveLength(1);
            expect(page2.metadata.hasMore).toBe(false);
        });
    });

    describe('Search and Statistics', () => {
        beforeEach(async () => {
            // Setup test data
            const record1 = createSampleTransformationRecord({ user: 'kasir01' });
            const record2 = createSampleTransformationRecord({ user: 'kasir02' });
            
            await auditLogger.logTransformation(record1);
            await auditLogger.logTransformation(record2);
            await auditLogger.logEvent('info', 'Test event with AQUA keyword');
        });

        test('should search logs correctly', async () => {
            const results = await auditLogger.searchLogs('AQUA');
            
            expect(results.length).toBeGreaterThan(0);
            // Should find both transformation logs and the event log
            const transformationLogs = results.filter(log => log.type === 'transformation');
            const eventLogs = results.filter(log => log.type === 'event');
            
            expect(transformationLogs.length).toBe(2);
            expect(eventLogs.length).toBe(1);
        });

        test('should get transformation statistics', async () => {
            const stats = await auditLogger.getTransformationStatistics();
            
            expect(stats.totalTransformations).toBe(2);
            expect(stats.successfulTransformations).toBe(2);
            expect(stats.failedTransformations).toBe(0);
            expect(stats.uniqueUsers).toBe(2);
            expect(stats.uniqueProducts).toBe(1);
        });

        test('should get daily summary', async () => {
            const summary = await auditLogger.getDailyTransformationSummary(7);
            
            expect(Array.isArray(summary)).toBe(true);
            expect(summary.length).toBeGreaterThan(0);
            
            const todaySummary = summary[0];
            expect(todaySummary.totalTransformations).toBe(2);
            expect(todaySummary.uniqueUsers).toBe(2);
        });
    });

    describe('Export Functionality', () => {
        beforeEach(async () => {
            const record = createSampleTransformationRecord();
            await auditLogger.logTransformation(record);
        });

        test('should export to JSON format', async () => {
            const jsonData = await auditLogger.exportTransformationHistory({}, 'json');
            
            expect(typeof jsonData).toBe('string');
            const parsed = JSON.parse(jsonData);
            expect(parsed.exportTimestamp).toBeDefined();
            expect(parsed.totalRecords).toBe(1);
            expect(Array.isArray(parsed.transformations)).toBe(true);
        });

        test('should export to CSV format', async () => {
            const csvData = await auditLogger.exportTransformationHistory({}, 'csv');
            
            expect(typeof csvData).toBe('string');
            expect(csvData).toContain('Timestamp,User,Status');
            expect(csvData).toContain('kasir01');
            expect(csvData).toContain('completed');
        });

        test('should handle unsupported export format', async () => {
            await expect(auditLogger.exportTransformationHistory({}, 'xml'))
                .rejects.toThrow('Format export tidak didukung: xml');
        });
    });

    describe('Log Management', () => {
        test('should cleanup old logs', async () => {
            // Create some logs
            const record = createSampleTransformationRecord();
            await auditLogger.logTransformation(record);
            await auditLogger.logEvent('info', 'Test event');
            
            // Cleanup with 0 retention days (should remove all)
            const deletedCount = await auditLogger.cleanupOldLogs(0);
            
            expect(deletedCount).toBeGreaterThan(0);
            
            // Verify logs were cleaned up
            const history = await auditLogger.getTransformationHistory();
            expect(history.data).toHaveLength(0);
        });

        test('should get specific transformation log', async () => {
            const record = createSampleTransformationRecord();
            await auditLogger.logTransformation(record);
            
            const log = await auditLogger.getTransformationLog(record.id);
            
            expect(log).toBeTruthy();
            expect(log.transformationId).toBe(record.id);
            expect(log.user).toBe(record.user);
        });

        test('should return null for non-existent transformation log', async () => {
            const log = await auditLogger.getTransformationLog('NON-EXISTENT-ID');
            expect(log).toBeNull();
        });
    });

    describe('Property-Based Tests', () => {
        test('Transaction logging completeness property', () => {
            /**
             * Feature: transformasi-barang, Property 4: Transaction Logging Completeness
             * Validates: Requirements 1.4
             */
            fc.assert(fc.property(
                fc.record({
                    user: fc.string({ minLength: 1, maxLength: 20 }),
                    sourceQuantity: fc.integer({ min: 1, max: 10 }),
                    targetQuantity: fc.integer({ min: 1, max: 100 }),
                    conversionRatio: fc.integer({ min: 1, max: 20 }),
                    status: fc.constantFrom('completed', 'failed', 'pending')
                }),
                async (data) => {
                    try {
                        const sourceItem = new TransformationItem({
                            id: 'TEST-SOURCE',
                            name: 'Test Source Item',
                            unit: 'dus',
                            quantity: data.sourceQuantity,
                            stockBefore: 100,
                            stockAfter: 100 - data.sourceQuantity
                        });

                        const targetItem = new TransformationItem({
                            id: 'TEST-TARGET',
                            name: 'Test Target Item',
                            unit: 'pcs',
                            quantity: data.targetQuantity,
                            stockBefore: 50,
                            stockAfter: 50 + data.targetQuantity
                        });

                        const record = new TransformationRecord({
                            user: data.user,
                            sourceItem,
                            targetItem,
                            conversionRatio: data.conversionRatio,
                            status: data.status
                        });

                        const testLogger = new AuditLogger();
                        testLogger.initialize();

                        // Log the transformation
                        const logResult = await testLogger.logTransformation(record);
                        expect(logResult).toBe(true);

                        // Verify log completeness
                        const history = await testLogger.getTransformationHistory();
                        expect(history.data).toHaveLength(1);

                        const logEntry = history.data[0];
                        
                        // Verify all required fields are present
                        expect(logEntry.id).toBeDefined();
                        expect(logEntry.timestamp).toBeDefined();
                        expect(logEntry.type).toBe('transformation');
                        expect(logEntry.transformationId).toBe(record.id);
                        expect(logEntry.user).toBe(data.user);
                        expect(logEntry.status).toBe(data.status);
                        expect(logEntry.sourceItem).toBeDefined();
                        expect(logEntry.targetItem).toBeDefined();
                        expect(logEntry.conversionRatio).toBe(data.conversionRatio);
                        expect(logEntry.metadata).toBeDefined();

                        // Verify source item details
                        expect(logEntry.sourceItem.id).toBe('TEST-SOURCE');
                        expect(logEntry.sourceItem.quantity).toBe(data.sourceQuantity);
                        expect(logEntry.sourceItem.stockBefore).toBe(100);
                        expect(logEntry.sourceItem.stockAfter).toBe(100 - data.sourceQuantity);

                        // Verify target item details
                        expect(logEntry.targetItem.id).toBe('TEST-TARGET');
                        expect(logEntry.targetItem.quantity).toBe(data.targetQuantity);
                        expect(logEntry.targetItem.stockBefore).toBe(50);
                        expect(logEntry.targetItem.stockAfter).toBe(50 + data.targetQuantity);
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('validation error') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 50 });
        });

        test('Complete transaction logging property', () => {
            /**
             * Feature: transformasi-barang, Property 16: Complete Transaction Logging
             * Validates: Requirements 4.1
             */
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        user: fc.string({ minLength: 1, maxLength: 10 }),
                        status: fc.constantFrom('completed', 'failed'),
                        sourceQuantity: fc.integer({ min: 1, max: 5 }),
                        targetQuantity: fc.integer({ min: 1, max: 50 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                async (transformationsData) => {
                    try {
                        const testLogger = new AuditLogger();
                        testLogger.initialize();

                        // Log multiple transformations
                        for (const data of transformationsData) {
                            const sourceItem = new TransformationItem({
                                id: `SOURCE-${Math.random().toString(36).substr(2, 9)}`,
                                name: 'Test Source',
                                unit: 'dus',
                                quantity: data.sourceQuantity,
                                stockBefore: 100,
                                stockAfter: 100 - data.sourceQuantity
                            });

                            const targetItem = new TransformationItem({
                                id: `TARGET-${Math.random().toString(36).substr(2, 9)}`,
                                name: 'Test Target',
                                unit: 'pcs',
                                quantity: data.targetQuantity,
                                stockBefore: 50,
                                stockAfter: 50 + data.targetQuantity
                            });

                            const record = new TransformationRecord({
                                user: data.user,
                                sourceItem,
                                targetItem,
                                conversionRatio: Math.floor(data.targetQuantity / data.sourceQuantity),
                                status: data.status
                            });

                            await testLogger.logTransformation(record);
                        }

                        // Verify all transformations were logged
                        const history = await testLogger.getTransformationHistory();
                        expect(history.data).toHaveLength(transformationsData.length);

                        // Verify chronological order (newest first)
                        for (let i = 0; i < history.data.length - 1; i++) {
                            const current = new Date(history.data[i].timestamp);
                            const next = new Date(history.data[i + 1].timestamp);
                            expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
                        }

                        // Verify each log has complete information
                        history.data.forEach(log => {
                            expect(log.id).toBeDefined();
                            expect(log.timestamp).toBeDefined();
                            expect(log.transformationId).toBeDefined();
                            expect(log.user).toBeDefined();
                            expect(log.status).toBeDefined();
                            expect(log.sourceItem).toBeDefined();
                            expect(log.targetItem).toBeDefined();
                            expect(log.conversionRatio).toBeDefined();
                        });

                        // Test filtering functionality
                        const completedLogs = await testLogger.getTransformationHistory({ status: 'completed' });
                        const failedLogs = await testLogger.getTransformationHistory({ status: 'failed' });
                        
                        const expectedCompleted = transformationsData.filter(t => t.status === 'completed').length;
                        const expectedFailed = transformationsData.filter(t => t.status === 'failed').length;
                        
                        expect(completedLogs.data).toHaveLength(expectedCompleted);
                        expect(failedLogs.data).toHaveLength(expectedFailed);
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('validation error') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 30 });
        });

        test('Chronological history display property', () => {
            /**
             * Feature: transformasi-barang, Property 17: Chronological History Display
             * Validates: Requirements 4.2
             */
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        user: fc.string({ minLength: 1, maxLength: 10 }),
                        delayMs: fc.integer({ min: 1, max: 100 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                async (transformationsData) => {
                    try {
                        const testLogger = new AuditLogger();
                        testLogger.initialize();

                        const recordedTimestamps = [];

                        // Log transformations with delays to ensure different timestamps
                        for (const data of transformationsData) {
                            const sourceItem = new TransformationItem({
                                id: `SOURCE-${Math.random().toString(36).substr(2, 9)}`,
                                name: 'Test Source',
                                unit: 'dus',
                                quantity: 1,
                                stockBefore: 100,
                                stockAfter: 99
                            });

                            const targetItem = new TransformationItem({
                                id: `TARGET-${Math.random().toString(36).substr(2, 9)}`,
                                name: 'Test Target',
                                unit: 'pcs',
                                quantity: 12,
                                stockBefore: 50,
                                stockAfter: 62
                            });

                            const record = new TransformationRecord({
                                user: data.user,
                                sourceItem,
                                targetItem,
                                conversionRatio: 12,
                                status: 'completed'
                            });

                            await testLogger.logTransformation(record);
                            recordedTimestamps.push(Date.now());
                            
                            // Add delay to ensure different timestamps
                            await new Promise(resolve => setTimeout(resolve, data.delayMs));
                        }

                        // Get history and verify chronological order
                        const history = await testLogger.getTransformationHistory();
                        expect(history.data).toHaveLength(transformationsData.length);

                        // Verify newest first ordering
                        for (let i = 0; i < history.data.length - 1; i++) {
                            const currentTimestamp = new Date(history.data[i].timestamp).getTime();
                            const nextTimestamp = new Date(history.data[i + 1].timestamp).getTime();
                            
                            expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
                        }

                        // Verify filtering maintains chronological order
                        const filteredHistory = await testLogger.getTransformationHistory({
                            user: transformationsData[0].user
                        });
                        
                        for (let i = 0; i < filteredHistory.data.length - 1; i++) {
                            const currentTimestamp = new Date(filteredHistory.data[i].timestamp).getTime();
                            const nextTimestamp = new Date(filteredHistory.data[i + 1].timestamp).getTime();
                            
                            expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
                        }
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('validation error') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 20 });
        });
    });

    describe('Error Handling', () => {
        test('should handle corrupted localStorage data', () => {
            // Corrupt the data
            localStorage.setItem('transformationLogs', 'invalid json');
            
            const corruptedLogger = new AuditLogger();
            corruptedLogger.initialize();
            
            // Should handle gracefully
            expect(corruptedLogger.logCache).toEqual([]);
        });

        test('should handle missing initialization', () => {
            const uninitializedLogger = new AuditLogger();
            
            expect(() => uninitializedLogger.getTransformationHistory())
                .rejects.toThrow('AuditLogger belum diinisialisasi');
        });
    });
});