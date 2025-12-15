/**
 * Property-based tests untuk Data Model Validation - Transformasi Barang
 * 
 * Property 14: Invalid Data Rejection
 * Validates: Requirements 3.4
 */

import fc from 'fast-check';

// Import modules untuk testing
let TransformationItem, TransformationRecord;

// Setup untuk browser environment
if (typeof window !== 'undefined') {
    TransformationItem = window.TransformationItem;
    TransformationRecord = window.TransformationRecord;
} else {
    // Node.js environment - load dari file
    const path = require('path');
    const fs = require('fs');
    
    // Load dan evaluate file JavaScript
    const dataModelsPath = path.join(__dirname, '../../js/transformasi-barang/DataModels.js');
    const dataModelsCode = fs.readFileSync(dataModelsPath, 'utf8');
    
    // Create a mock environment
    const mockWindow = {};
    eval(dataModelsCode.replace('window.', 'mockWindow.'));
    
    TransformationItem = mockWindow.TransformationItem;
    TransformationRecord = mockWindow.TransformationRecord;
}

describe('Feature: transformasi-barang, Property 14: Invalid Data Rejection', () => {
    
    // Generator untuk data TransformationItem yang valid
    const validTransformationItemArb = fc.record({
        id: fc.string({ minLength: 1 }),
        name: fc.string({ minLength: 1 }),
        unit: fc.string({ minLength: 1 }),
        quantity: fc.nat(),
        stockBefore: fc.nat(),
        stockAfter: fc.nat(),
        baseProduct: fc.string({ minLength: 1 })
    });

    // Generator untuk data TransformationItem yang invalid
    const invalidTransformationItemArb = fc.oneof(
        // ID invalid
        fc.record({
            id: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(''), fc.integer()),
            name: fc.string({ minLength: 1 }),
            unit: fc.string({ minLength: 1 }),
            quantity: fc.nat(),
            stockBefore: fc.nat(),
            stockAfter: fc.nat()
        }),
        // Name invalid
        fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(''), fc.integer()),
            unit: fc.string({ minLength: 1 }),
            quantity: fc.nat(),
            stockBefore: fc.nat(),
            stockAfter: fc.nat()
        }),
        // Unit invalid
        fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            unit: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(''), fc.integer()),
            quantity: fc.nat(),
            stockBefore: fc.nat(),
            stockAfter: fc.nat()
        }),
        // Quantity invalid (negative)
        fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            unit: fc.string({ minLength: 1 }),
            quantity: fc.integer({ max: -1 }),
            stockBefore: fc.nat(),
            stockAfter: fc.nat()
        }),
        // StockBefore invalid (negative)
        fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            unit: fc.string({ minLength: 1 }),
            quantity: fc.nat(),
            stockBefore: fc.integer({ max: -1 }),
            stockAfter: fc.nat()
        }),
        // StockAfter invalid (negative)
        fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            unit: fc.string({ minLength: 1 }),
            quantity: fc.nat(),
            stockBefore: fc.nat(),
            stockAfter: fc.integer({ max: -1 })
        })
    );

    test('Property 14.1: Valid TransformationItem data should be accepted', () => {
        fc.assert(fc.property(validTransformationItemArb, (data) => {
            // Valid data should not throw error
            expect(() => {
                const item = new TransformationItem(data);
                expect(item).toBeInstanceOf(TransformationItem);
                expect(item.id).toBe(data.id);
                expect(item.name).toBe(data.name);
                expect(item.unit).toBe(data.unit);
                expect(item.quantity).toBe(data.quantity);
                expect(item.stockBefore).toBe(data.stockBefore);
                expect(item.stockAfter).toBe(data.stockAfter);
            }).not.toThrow();
        }), { numRuns: 100 });
    });

    test('Property 14.2: Invalid TransformationItem data should be rejected', () => {
        fc.assert(fc.property(invalidTransformationItemArb, (data) => {
            // Invalid data should throw error
            expect(() => {
                new TransformationItem(data);
            }).toThrow();
        }), { numRuns: 100 });
    });

    // Generator untuk data TransformationRecord yang valid
    const validTransformationRecordArb = fc.record({
        user: fc.string({ minLength: 1 }),
        sourceItem: validTransformationItemArb,
        targetItem: validTransformationItemArb,
        conversionRatio: fc.float({ min: Math.fround(0.001), max: Math.fround(1000) }),
        status: fc.oneof(fc.constant('pending'), fc.constant('completed'), fc.constant('failed'))
    });

    // Generator untuk data TransformationRecord yang invalid
    const invalidTransformationRecordArb = fc.oneof(
        // User invalid
        fc.record({
            user: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(''), fc.integer()),
            sourceItem: validTransformationItemArb,
            targetItem: validTransformationItemArb,
            conversionRatio: fc.float({ min: 0.001, max: 1000 }),
            status: fc.constant('completed')
        }),
        // ConversionRatio invalid (zero or negative)
        fc.record({
            user: fc.string({ minLength: 1 }),
            sourceItem: validTransformationItemArb,
            targetItem: validTransformationItemArb,
            conversionRatio: fc.oneof(fc.constant(0), fc.float({ max: -0.001 })),
            status: fc.constant('completed')
        }),
        // Status invalid
        fc.record({
            user: fc.string({ minLength: 1 }),
            sourceItem: validTransformationItemArb,
            targetItem: validTransformationItemArb,
            conversionRatio: fc.float({ min: 0.001, max: 1000 }),
            status: fc.string().filter(s => !['pending', 'completed', 'failed'].includes(s))
        })
    );

    test('Property 14.3: Valid TransformationRecord data should be accepted', () => {
        fc.assert(fc.property(validTransformationRecordArb, (data) => {
            // Valid data should not throw error
            expect(() => {
                const record = new TransformationRecord(data);
                expect(record).toBeInstanceOf(TransformationRecord);
                expect(record.user).toBe(data.user);
                expect(record.sourceItem).toBeInstanceOf(TransformationItem);
                expect(record.targetItem).toBeInstanceOf(TransformationItem);
                expect(record.conversionRatio).toBe(data.conversionRatio);
                expect(record.status).toBe(data.status);
            }).not.toThrow();
        }), { numRuns: 100 });
    });

    test('Property 14.4: Invalid TransformationRecord data should be rejected', () => {
        fc.assert(fc.property(invalidTransformationRecordArb, (data) => {
            // Invalid data should throw error
            expect(() => {
                new TransformationRecord(data);
            }).toThrow();
        }), { numRuns: 100 });
    });

    test('Property 14.5: JSON serialization and deserialization should preserve data integrity', () => {
        fc.assert(fc.property(validTransformationRecordArb, (data) => {
            const originalRecord = new TransformationRecord(data);
            const json = originalRecord.toJSON();
            const deserializedRecord = TransformationRecord.fromJSON(json);
            
            // Data should be preserved after serialization/deserialization
            expect(deserializedRecord.id).toBe(originalRecord.id);
            expect(deserializedRecord.user).toBe(originalRecord.user);
            expect(deserializedRecord.conversionRatio).toBe(originalRecord.conversionRatio);
            expect(deserializedRecord.status).toBe(originalRecord.status);
            expect(deserializedRecord.sourceItem.id).toBe(originalRecord.sourceItem.id);
            expect(deserializedRecord.targetItem.id).toBe(originalRecord.targetItem.id);
        }), { numRuns: 100 });
    });

    test('Property 14.6: TransformationItem JSON serialization should preserve data integrity', () => {
        fc.assert(fc.property(validTransformationItemArb, (data) => {
            const originalItem = new TransformationItem(data);
            const json = originalItem.toJSON();
            const deserializedItem = TransformationItem.fromJSON(json);
            
            // Data should be preserved after serialization/deserialization
            expect(deserializedItem.id).toBe(originalItem.id);
            expect(deserializedItem.name).toBe(originalItem.name);
            expect(deserializedItem.unit).toBe(originalItem.unit);
            expect(deserializedItem.quantity).toBe(originalItem.quantity);
            expect(deserializedItem.stockBefore).toBe(originalItem.stockBefore);
            expect(deserializedItem.stockAfter).toBe(originalItem.stockAfter);
        }), { numRuns: 100 });
    });
});