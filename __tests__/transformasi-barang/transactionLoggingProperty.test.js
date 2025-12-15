/**
 * Property Test: Transaction Logging Completeness
 * Validates: Requirements 1.4
 * 
 * Property 4: Transaction Logging Completeness
 * For any valid transformation, the audit log should contain complete transaction details
 */

import fc from 'fast-check';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Property Test: Transaction Logging Completeness', () => {
    let auditLogger;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        sessionStorage.clear();
        
        auditLogger = new AuditLogger();
        auditLogger.initialize();
    });

    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('Property 4: Complete transaction details are logged for any valid transformation', () => {
        fc.assert(fc.property(
            // Generate valid transformation record
            fc.record({
                id: fc.string({ minLength: 1, maxLength: 50 }),
                user: fc.string({ minLength: 1, maxLength: 30 }),
                status: fc.constantFrom('completed', 'failed', 'pending'),
                sourceItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 50 }),
                    name: fc.string({ minLength: 1, maxLength: 100 }),
                    unit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG', 'LITER'),
                    quantity: fc.integer({ min: 1, max: 1000 }),
                    stockBefore: fc.integer({ min: 0, max: 10000 }),
                    stockAfter: fc.integer({ min: 0, max: 10000 }),
                    baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                }),
                targetItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 50 }),
                    name: fc.string({ minLength: 1, maxLength: 100 }),
                    unit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG', 'LITER'),
                    quantity: fc.integer({ min: 1, max: 1000 }),
                    stockBefore: fc.integer({ min: 0, max: 10000 }),
                    stockAfter: fc.integer({ min: 0, max: 10000 }),
                    baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                }),
                conversionRatio: fc.integer({ min: 1, max: 100 })
            }),
            async (transformationRecord) => {
                // Ensure source and target have same base product
                transformationRecord.targetItem.baseProduct = transformationRecord.sourceItem.baseProduct;
                
                // Log the transformation
                const logId = await auditLogger.logTransformation(transformationRecord);
                
                // Verify log ID is generated
                expect(logId).toBeDefined();
                expect(typeof logId).toBe('string');
                expect(logId.length).toBeGreaterThan(0);
                
                // Retrieve the logged transformation
                const loggedTransformation = await auditLogger.getTransformationLog(transformationRecord.id);
                
                // Verify complete transaction details are logged
                expect(loggedTransformation).toBeDefined();
                expect(loggedTransformation.type).toBe('transformation');
                expect(loggedTransformation.transformationId).toBe(transformationRecord.id);
                expect(loggedTransformation.user).toBe(transformationRecord.user);
                expect(loggedTransformation.status).toBe(transformationRecord.status);
                
                // Verify source item details
                expect(loggedTransformation.sourceItem.id).toBe(transformationRecord.sourceItem.id);
                expect(loggedTransformation.sourceItem.name).toBe(transformationRecord.sourceItem.name);
                expect(loggedTransformation.sourceItem.unit).toBe(transformationRecord.sourceItem.unit);
                expect(loggedTransformation.sourceItem.quantity).toBe(transformationRecord.sourceItem.quantity);
                expect(loggedTransformation.sourceItem.stockBefore).toBe(transformationRecord.sourceItem.stockBefore);
                expect(loggedTransformation.sourceItem.stockAfter).toBe(transformationRecord.sourceItem.stockAfter);
                
                // Verify target item details
                expect(loggedTransformation.targetItem.id).toBe(transformationRecord.targetItem.id);
                expect(loggedTransformation.targetItem.name).toBe(transformationRecord.targetItem.name);
                expect(loggedTransformation.targetItem.unit).toBe(transformationRecord.targetItem.unit);
                expect(loggedTransformation.targetItem.quantity).toBe(transformationRecord.targetItem.quantity);
                expect(loggedTransformation.targetItem.stockBefore).toBe(transformationRecord.targetItem.stockBefore);
                expect(loggedTransformation.targetItem.stockAfter).toBe(transformationRecord.targetItem.stockAfter);
                
                // Verify conversion ratio
                expect(loggedTransformation.conversionRatio).toBe(transformationRecord.conversionRatio);
                
                // Verify metadata
                expect(loggedTransformation.metadata).toBeDefined();
                expect(loggedTransformation.metadata.baseProduct).toBe(transformationRecord.sourceItem.baseProduct);
                expect(loggedTransformation.metadata.transformationType).toBe(
                    `${transformationRecord.sourceItem.unit}_to_${transformationRecord.targetItem.unit}`
                );
                
                // Verify timestamp is valid
                expect(loggedTransformation.timestamp).toBeDefined();
                expect(new Date(loggedTransformation.timestamp)).toBeInstanceOf(Date);
                expect(new Date(loggedTransformation.timestamp).getTime()).not.toBeNaN();
                
                // Verify log ID is unique
                expect(loggedTransformation.id).toBeDefined();
                expect(typeof loggedTransformation.id).toBe('string');
                expect(loggedTransformation.id.startsWith('LOG-')).toBe(true);
            }
        ), { numRuns: 50 });
    });

    test('Property 4.1: All required fields are present in logged transformation', () => {
        fc.assert(fc.property(
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
            async (transformationRecord) => {
                // Ensure same base product
                transformationRecord.targetItem.baseProduct = transformationRecord.sourceItem.baseProduct;
                
                await auditLogger.logTransformation(transformationRecord);
                const loggedTransformation = await auditLogger.getTransformationLog(transformationRecord.id);
                
                // Check all required fields are present
                const requiredFields = [
                    'id', 'timestamp', 'type', 'transformationId', 'user', 'status',
                    'sourceItem', 'targetItem', 'conversionRatio', 'metadata'
                ];
                
                requiredFields.forEach(field => {
                    expect(loggedTransformation).toHaveProperty(field);
                    expect(loggedTransformation[field]).toBeDefined();
                });
                
                // Check source item required fields
                const sourceRequiredFields = ['id', 'name', 'unit', 'quantity', 'stockBefore', 'stockAfter', 'baseProduct'];
                sourceRequiredFields.forEach(field => {
                    expect(loggedTransformation.sourceItem).toHaveProperty(field);
                    expect(loggedTransformation.sourceItem[field]).toBeDefined();
                });
                
                // Check target item required fields
                const targetRequiredFields = ['id', 'name', 'unit', 'quantity', 'stockBefore', 'stockAfter', 'baseProduct'];
                targetRequiredFields.forEach(field => {
                    expect(loggedTransformation.targetItem).toHaveProperty(field);
                    expect(loggedTransformation.targetItem[field]).toBeDefined();
                });
                
                // Check metadata required fields
                expect(loggedTransformation.metadata).toHaveProperty('baseProduct');
                expect(loggedTransformation.metadata).toHaveProperty('transformationType');
                expect(loggedTransformation.metadata).toHaveProperty('totalValueChange');
            }
        ), { numRuns: 30 });
    });

    test('Property 4.2: Logged transformations can be retrieved consistently', () => {
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
                    conversionRatio: fc.integer({ min: 1, max: 50 })
                }),
                { minLength: 1, maxLength: 10 }
            ),
            async (transformationRecords) => {
                // Ensure unique IDs
                const uniqueRecords = transformationRecords.map((record, index) => ({
                    ...record,
                    id: `${record.id}_${index}`,
                    targetItem: {
                        ...record.targetItem,
                        baseProduct: record.sourceItem.baseProduct
                    }
                }));
                
                // Log all transformations
                const logIds = [];
                for (const record of uniqueRecords) {
                    const logId = await auditLogger.logTransformation(record);
                    logIds.push(logId);
                }
                
                // Verify all transformations can be retrieved
                for (let i = 0; i < uniqueRecords.length; i++) {
                    const record = uniqueRecords[i];
                    const loggedTransformation = await auditLogger.getTransformationLog(record.id);
                    
                    expect(loggedTransformation).toBeDefined();
                    expect(loggedTransformation.transformationId).toBe(record.id);
                    expect(loggedTransformation.user).toBe(record.user);
                    expect(loggedTransformation.status).toBe(record.status);
                }
                
                // Verify history contains all transformations
                const history = await auditLogger.getTransformationHistory();
                expect(history.data.length).toBeGreaterThanOrEqual(uniqueRecords.length);
                
                // Verify each transformation is in history
                uniqueRecords.forEach(record => {
                    const foundInHistory = history.data.some(log => log.transformationId === record.id);
                    expect(foundInHistory).toBe(true);
                });
            }
        ), { numRuns: 20 });
    });
});