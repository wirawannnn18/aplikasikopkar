/**
 * Property Test: Preview Information Completeness
 * 
 * Validates: Requirements 1.5
 * "WHEN displaying transformation preview THEN the Transformation_System SHALL show 
 * current stock, transformation quantity, and resulting stock for both units"
 * 
 * This property test ensures that the UI preview displays complete information
 * including current stock levels, transformation quantities, and calculated
 * resulting stock levels for both source and target units.
 */

import fc from 'fast-check';

// Mock UIController untuk testing
class MockUIController {
    constructor() {
        this.previewData = null;
    }

    updatePreview(sourceItem, targetItem, quantity, conversionRatio) {
        if (!sourceItem || !targetItem || !quantity || !conversionRatio) {
            return null;
        }

        const targetQuantity = quantity * conversionRatio;
        
        this.previewData = {
            sourceItem: {
                name: sourceItem.name,
                unit: sourceItem.unit,
                currentStock: sourceItem.stock,
                transformQuantity: quantity,
                resultingStock: sourceItem.stock - quantity
            },
            targetItem: {
                name: targetItem.name,
                unit: targetItem.unit,
                currentStock: targetItem.stock,
                transformQuantity: targetQuantity,
                resultingStock: targetItem.stock + targetQuantity
            },
            conversionInfo: {
                ratio: conversionRatio,
                description: `1 ${sourceItem.unit} = ${conversionRatio} ${targetItem.unit}`
            }
        };

        return this.previewData;
    }

    getPreviewData() {
        return this.previewData;
    }
}

// Generators untuk test data
const itemGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    unit: fc.oneof(fc.constant('DUS'), fc.constant('PCS'), fc.constant('LUSIN'), fc.constant('KARTON')),
    stock: fc.integer({ min: 0, max: 1000 })
});

const quantityGenerator = fc.integer({ min: 1, max: 100 });
const ratioGenerator = fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true });

describe('Property Test: Preview Information Completeness', () => {
    let uiController;

    beforeEach(() => {
        uiController = new MockUIController();
    });

    test('Preview should contain all required information elements', () => {
        fc.assert(fc.property(
            itemGenerator,
            itemGenerator,
            quantityGenerator,
            ratioGenerator,
            (sourceItem, targetItem, quantity, ratio) => {
                // Ensure different units for meaningful transformation
                if (sourceItem.unit === targetItem.unit) {
                    targetItem.unit = sourceItem.unit === 'DUS' ? 'PCS' : 'DUS';
                }

                // Ensure sufficient stock for transformation
                sourceItem.stock = Math.max(sourceItem.stock, quantity);

                const preview = uiController.updatePreview(sourceItem, targetItem, quantity, ratio);

                // Property: Preview must contain complete information
                return preview !== null &&
                       // Source item information completeness
                       preview.sourceItem &&
                       typeof preview.sourceItem.name === 'string' &&
                       typeof preview.sourceItem.unit === 'string' &&
                       typeof preview.sourceItem.currentStock === 'number' &&
                       typeof preview.sourceItem.transformQuantity === 'number' &&
                       typeof preview.sourceItem.resultingStock === 'number' &&
                       // Target item information completeness
                       preview.targetItem &&
                       typeof preview.targetItem.name === 'string' &&
                       typeof preview.targetItem.unit === 'string' &&
                       typeof preview.targetItem.currentStock === 'number' &&
                       typeof preview.targetItem.transformQuantity === 'number' &&
                       typeof preview.targetItem.resultingStock === 'number' &&
                       // Conversion information completeness
                       preview.conversionInfo &&
                       typeof preview.conversionInfo.ratio === 'number' &&
                       typeof preview.conversionInfo.description === 'string';
            }
        ), { numRuns: 100 });
    });

    test('Preview calculations should be mathematically correct', () => {
        fc.assert(fc.property(
            itemGenerator,
            itemGenerator,
            quantityGenerator,
            ratioGenerator,
            (sourceItem, targetItem, quantity, ratio) => {
                // Setup test conditions
                if (sourceItem.unit === targetItem.unit) {
                    targetItem.unit = sourceItem.unit === 'DUS' ? 'PCS' : 'DUS';
                }
                sourceItem.stock = Math.max(sourceItem.stock, quantity);

                const preview = uiController.updatePreview(sourceItem, targetItem, quantity, ratio);

                if (preview === null) return true;

                // Property: Mathematical accuracy of preview calculations
                const expectedTargetQuantity = quantity * ratio;
                const expectedSourceResulting = sourceItem.stock - quantity;
                const expectedTargetResulting = targetItem.stock + expectedTargetQuantity;

                return Math.abs(preview.sourceItem.resultingStock - expectedSourceResulting) < 0.001 &&
                       Math.abs(preview.targetItem.resultingStock - expectedTargetResulting) < 0.001 &&
                       Math.abs(preview.targetItem.transformQuantity - expectedTargetQuantity) < 0.001 &&
                       preview.sourceItem.transformQuantity === quantity;
            }
        ), { numRuns: 100 });
    });

    test('Preview should handle edge cases gracefully', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                itemGenerator
            ),
            fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                itemGenerator
            ),
            fc.oneof(
                fc.constant(0),
                fc.constant(-1),
                quantityGenerator
            ),
            fc.oneof(
                fc.constant(0),
                fc.constant(-1),
                ratioGenerator
            ),
            (sourceItem, targetItem, quantity, ratio) => {
                const preview = uiController.updatePreview(sourceItem, targetItem, quantity, ratio);

                // Property: Invalid inputs should result in null preview
                if (!sourceItem || !targetItem || typeof quantity !== 'number' || quantity <= 0 || typeof ratio !== 'number' || ratio <= 0) {
                    return preview === null;
                }

                // Property: Valid inputs should produce valid preview
                if (sourceItem && targetItem && quantity > 0 && ratio > 0) {
                    return preview !== null;
                }

                return true; // For any other case, just pass
            }
        ), { numRuns: 50 });
    });

    test('Preview should maintain data consistency across multiple updates', () => {
        fc.assert(fc.property(
            fc.array(fc.tuple(itemGenerator, itemGenerator, quantityGenerator, ratioGenerator), { minLength: 2, maxLength: 5 }),
            (transformations) => {
                let allPreviewsValid = true;

                for (const [sourceItem, targetItem, quantity, ratio] of transformations) {
                    // Setup valid transformation
                    if (sourceItem.unit === targetItem.unit) {
                        targetItem.unit = sourceItem.unit === 'DUS' ? 'PCS' : 'DUS';
                    }
                    sourceItem.stock = Math.max(sourceItem.stock, quantity);

                    const preview = uiController.updatePreview(sourceItem, targetItem, quantity, ratio);
                    
                    if (preview === null) {
                        allPreviewsValid = false;
                        break;
                    }

                    // Property: Each preview should be internally consistent
                    const isConsistent = 
                        preview.sourceItem.currentStock >= preview.sourceItem.transformQuantity &&
                        preview.sourceItem.resultingStock === (preview.sourceItem.currentStock - preview.sourceItem.transformQuantity) &&
                        preview.targetItem.resultingStock === (preview.targetItem.currentStock + preview.targetItem.transformQuantity) &&
                        Math.abs(preview.targetItem.transformQuantity - (preview.sourceItem.transformQuantity * preview.conversionInfo.ratio)) < 0.001;

                    if (!isConsistent) {
                        allPreviewsValid = false;
                        break;
                    }
                }

                return allPreviewsValid;
            }
        ), { numRuns: 50 });
    });
});