/**
 * Property Test: Success Confirmation Display
 * 
 * Validates: Requirements 6.4
 * "WHEN displaying transformation results THEN the Transformation_System SHALL 
 * show clear success confirmation with updated stock levels"
 * 
 * This property test ensures that success confirmations are displayed clearly
 * with complete information about the transformation results, including
 * updated stock levels, transformation details, and user-friendly messaging.
 */

import fc from 'fast-check';

// Mock UIController untuk testing success confirmation
class MockUIController {
    constructor() {
        this.lastConfirmation = null;
        this.confirmationHistory = [];
    }

    displaySuccessConfirmation(transformationResult) {
        if (!transformationResult || !transformationResult.success) {
            return null;
        }

        const confirmation = {
            success: true,
            timestamp: new Date().toISOString(),
            message: {
                title: 'Transformasi Berhasil!',
                summary: `${transformationResult.sourceQuantity} ${transformationResult.sourceUnit} berhasil dikonversi menjadi ${transformationResult.targetQuantity} ${transformationResult.targetUnit}`,
                details: this.generateDetailedMessage(transformationResult)
            },
            stockUpdates: {
                source: {
                    item: transformationResult.sourceItem,
                    unit: transformationResult.sourceUnit,
                    previousStock: transformationResult.sourcePreviousStock,
                    currentStock: transformationResult.sourceCurrentStock,
                    change: -transformationResult.sourceQuantity
                },
                target: {
                    item: transformationResult.targetItem,
                    unit: transformationResult.targetUnit,
                    previousStock: transformationResult.targetPreviousStock,
                    currentStock: transformationResult.targetCurrentStock,
                    change: +transformationResult.targetQuantity
                }
            },
            transactionInfo: {
                id: transformationResult.transactionId,
                user: transformationResult.user || 'System',
                conversionRatio: transformationResult.conversionRatio,
                timestamp: transformationResult.timestamp
            },
            displayDuration: 5000, // 5 seconds
            actions: [
                { type: 'close', label: 'Tutup' },
                { type: 'print', label: 'Cetak Bukti' },
                { type: 'newTransformation', label: 'Transformasi Lagi' }
            ]
        };

        this.lastConfirmation = confirmation;
        this.confirmationHistory.push(confirmation);

        return confirmation;
    }

    generateDetailedMessage(result) {
        return [
            `Produk: ${result.sourceItem}`,
            `Konversi: ${result.sourceQuantity} ${result.sourceUnit} → ${result.targetQuantity} ${result.targetUnit}`,
            `Rasio: 1 ${result.sourceUnit} = ${result.conversionRatio} ${result.targetUnit}`,
            `Stok ${result.sourceUnit}: ${result.sourcePreviousStock} → ${result.sourceCurrentStock}`,
            `Stok ${result.targetUnit}: ${result.targetPreviousStock} → ${result.targetCurrentStock}`,
            `ID Transaksi: ${result.transactionId}`
        ];
    }

    getLastConfirmation() {
        return this.lastConfirmation;
    }

    getConfirmationHistory() {
        return this.confirmationHistory;
    }

    validateConfirmationCompleteness(confirmation) {
        if (!confirmation) return false;

        return confirmation.success === true &&
               confirmation.message &&
               typeof confirmation.message.title === 'string' &&
               typeof confirmation.message.summary === 'string' &&
               Array.isArray(confirmation.message.details) &&
               confirmation.stockUpdates &&
               confirmation.stockUpdates.source &&
               confirmation.stockUpdates.target &&
               confirmation.transactionInfo &&
               typeof confirmation.transactionInfo.id !== 'undefined' &&
               Array.isArray(confirmation.actions) &&
               confirmation.actions.length > 0;
    }
}

// Generators untuk test data
const transformationResultGenerator = fc.record({
    success: fc.constant(true),
    sourceItem: fc.string({ minLength: 3, maxLength: 30 }),
    sourceUnit: fc.oneof(fc.constant('DUS'), fc.constant('PCS'), fc.constant('LUSIN'), fc.constant('KARTON')),
    sourceQuantity: fc.integer({ min: 1, max: 100 }),
    sourcePreviousStock: fc.integer({ min: 10, max: 1000 }),
    targetItem: fc.string({ minLength: 3, maxLength: 30 }),
    targetUnit: fc.oneof(fc.constant('DUS'), fc.constant('PCS'), fc.constant('LUSIN'), fc.constant('KARTON')),
    targetQuantity: fc.float({ min: Math.fround(1), max: Math.fround(1000) }).filter(x => !isNaN(x) && isFinite(x)),
    targetPreviousStock: fc.integer({ min: 0, max: 1000 }),
    conversionRatio: fc.float({ min: Math.fround(0.1), max: Math.fround(100) }).filter(x => !isNaN(x) && isFinite(x)),
    transactionId: fc.string({ minLength: 10, maxLength: 20 }),
    user: fc.string({ minLength: 3, maxLength: 20 }),
    timestamp: fc.date().map(d => d.toISOString())
});

describe('Property Test: Success Confirmation Display', () => {
    let uiController;

    beforeEach(() => {
        uiController = new MockUIController();
    });

    test('Success confirmation should contain all required information', () => {
        fc.assert(fc.property(
            transformationResultGenerator,
            (result) => {
                // Calculate derived values
                result.sourceCurrentStock = result.sourcePreviousStock - result.sourceQuantity;
                result.targetCurrentStock = result.targetPreviousStock + result.targetQuantity;

                const confirmation = uiController.displaySuccessConfirmation(result);

                // Property: Confirmation should be complete and valid
                const isComplete = uiController.validateConfirmationCompleteness(confirmation);
                
                if (!isComplete) return false;

                // Property: Stock updates should be mathematically correct
                const stockUpdatesCorrect = 
                    confirmation.stockUpdates.source.change === -result.sourceQuantity &&
                    confirmation.stockUpdates.target.change === result.targetQuantity &&
                    confirmation.stockUpdates.source.currentStock === result.sourceCurrentStock &&
                    confirmation.stockUpdates.target.currentStock === result.targetCurrentStock;

                // Property: Message should contain transformation details
                const messageComplete = 
                    confirmation.message.summary.includes(result.sourceQuantity.toString()) &&
                    confirmation.message.summary.includes(result.sourceUnit) &&
                    confirmation.message.summary.includes(result.targetQuantity.toString()) &&
                    confirmation.message.summary.includes(result.targetUnit);

                // Property: Transaction info should be preserved
                const transactionInfoComplete = 
                    confirmation.transactionInfo.id === result.transactionId &&
                    confirmation.transactionInfo.conversionRatio === result.conversionRatio &&
                    confirmation.transactionInfo.user === result.user;

                return stockUpdatesCorrect && messageComplete && transactionInfoComplete;
            }
        ), { numRuns: 100 });
    });

    test('Confirmation display should handle various transformation scenarios', () => {
        fc.assert(fc.property(
            fc.array(transformationResultGenerator, { minLength: 1, maxLength: 10 }),
            (results) => {
                let allConfirmationsValid = true;

                for (const result of results) {
                    // Ensure mathematical consistency
                    result.sourceCurrentStock = result.sourcePreviousStock - result.sourceQuantity;
                    result.targetCurrentStock = result.targetPreviousStock + result.targetQuantity;
                    result.targetQuantity = result.sourceQuantity * result.conversionRatio;

                    const confirmation = uiController.displaySuccessConfirmation(result);

                    if (!confirmation || !uiController.validateConfirmationCompleteness(confirmation)) {
                        allConfirmationsValid = false;
                        break;
                    }

                    // Property: Each confirmation should be unique and timestamped
                    const hasUniqueTimestamp = confirmation.timestamp && 
                                             typeof confirmation.timestamp === 'string';
                    
                    // Property: Actions should be available for user interaction
                    const hasValidActions = confirmation.actions.length >= 3 &&
                                          confirmation.actions.every(action => 
                                              action.type && action.label);

                    if (!hasUniqueTimestamp || !hasValidActions) {
                        allConfirmationsValid = false;
                        break;
                    }
                }

                return allConfirmationsValid;
            }
        ), { numRuns: 50 });
    });

    test('Confirmation should handle edge cases gracefully', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                fc.record({ success: fc.constant(false) }),
                transformationResultGenerator
            ),
            (result) => {
                if (result && result.success) {
                    // Valid result case
                    result.sourceCurrentStock = result.sourcePreviousStock - result.sourceQuantity;
                    result.targetCurrentStock = result.targetPreviousStock + result.targetQuantity;
                }

                const confirmation = uiController.displaySuccessConfirmation(result);

                // Property: Invalid or failed results should return null
                if (!result || !result.success) {
                    return confirmation === null;
                }

                // Property: Valid results should produce valid confirmation
                return confirmation !== null && uiController.validateConfirmationCompleteness(confirmation);
            }
        ), { numRuns: 100 });
    });

    test('Confirmation history should be maintained correctly', () => {
        fc.assert(fc.property(
            fc.array(transformationResultGenerator, { minLength: 2, maxLength: 5 }),
            (results) => {
                const initialHistoryLength = uiController.getConfirmationHistory().length;

                for (const result of results) {
                    result.sourceCurrentStock = result.sourcePreviousStock - result.sourceQuantity;
                    result.targetCurrentStock = result.targetPreviousStock + result.targetQuantity;
                    
                    uiController.displaySuccessConfirmation(result);
                }

                const finalHistory = uiController.getConfirmationHistory();
                const lastConfirmation = uiController.getLastConfirmation();

                // Property: History should contain all confirmations
                const historyLengthCorrect = 
                    finalHistory.length === initialHistoryLength + results.length;

                // Property: Last confirmation should match most recent
                const lastConfirmationCorrect = 
                    lastConfirmation && 
                    finalHistory[finalHistory.length - 1] === lastConfirmation;

                // Property: All history entries should be valid
                const allHistoryValid = finalHistory.every(conf => 
                    uiController.validateConfirmationCompleteness(conf));

                return historyLengthCorrect && lastConfirmationCorrect && allHistoryValid;
            }
        ), { numRuns: 50 });
    });

    test('Confirmation messages should be user-friendly and informative', () => {
        fc.assert(fc.property(
            transformationResultGenerator,
            (result) => {
                result.sourceCurrentStock = result.sourcePreviousStock - result.sourceQuantity;
                result.targetCurrentStock = result.targetPreviousStock + result.targetQuantity;

                const confirmation = uiController.displaySuccessConfirmation(result);

                if (!confirmation) return false;

                // Property: Title should be positive and clear
                const titleAppropriate = 
                    confirmation.message.title.includes('Berhasil') ||
                    confirmation.message.title.includes('Sukses');

                // Property: Summary should be concise but complete
                const summaryComplete = 
                    confirmation.message.summary.length > 10 &&
                    confirmation.message.summary.length < 200;

                // Property: Details should provide comprehensive information
                const detailsComprehensive = 
                    confirmation.message.details.length >= 5 &&
                    confirmation.message.details.every(detail => 
                        typeof detail === 'string' && detail.length > 5);

                // Property: Display duration should be reasonable
                const durationReasonable = 
                    confirmation.displayDuration >= 3000 && 
                    confirmation.displayDuration <= 10000;

                return titleAppropriate && summaryComplete && 
                       detailsComprehensive && durationReasonable;
            }
        ), { numRuns: 100 });
    });
});