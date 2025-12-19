/**
 * Preview Generator Tests
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import fc from 'fast-check';

// Import the class to test
let PreviewGenerator;

beforeAll(async () => {
    // Dynamic import to handle ES modules
    const module = await import('../../js/import-tagihan/PreviewGenerator.js');
    PreviewGenerator = module.PreviewGenerator;
});

describe('PreviewGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new PreviewGenerator();
    });

    describe('Constructor', () => {
        test('should initialize with default configuration', () => {
            expect(generator.maxPreviewRows).toBe(100);
        });
    });

    describe('formatCurrency', () => {
        test('should format valid numbers as Indonesian currency', () => {
            expect(generator.formatCurrency(1000)).toMatch(/Rp\s*1\.000/);
            expect(generator.formatCurrency(1000000)).toMatch(/Rp\s*1\.000\.000/);
            expect(generator.formatCurrency(0)).toMatch(/Rp\s*0/);
        });

        test('should handle invalid inputs gracefully', () => {
            expect(generator.formatCurrency(NaN)).toBe('Rp 0');
            expect(generator.formatCurrency('invalid')).toBe('Rp 0');
            expect(generator.formatCurrency(null)).toBe('Rp 0');
            expect(generator.formatCurrency(undefined)).toBe('Rp 0');
        });
    });

    describe('generatePreviewTable', () => {
        test('should generate preview table with correct structure', () => {
            const validatedData = [
                {
                    rowNumber: 1,
                    memberNumber: '001',
                    memberName: 'John Doe',
                    paymentType: 'hutang',
                    amount: 500000,
                    description: 'Test payment',
                    isValid: true,
                    validationErrors: []
                },
                {
                    rowNumber: 2,
                    memberNumber: '002',
                    memberName: 'Jane Smith',
                    paymentType: 'piutang',
                    amount: 300000,
                    description: 'Test payment 2',
                    isValid: false,
                    validationErrors: ['Member not found']
                }
            ];

            const result = generator.generatePreviewTable(validatedData);

            expect(result.rows).toHaveLength(2);
            expect(result.hasMore).toBe(false);
            expect(result.totalRows).toBe(2);
            expect(result.showingRows).toBe(2);

            // Check valid row formatting
            expect(result.rows[0].statusClass).toBe('table-success');
            expect(result.rows[0].statusIcon).toBe('bi-check-circle-fill');
            expect(result.rows[0].statusText).toBe('Valid');
            expect(result.rows[0].formattedAmount).toMatch(/Rp\s*500\.000/);
            expect(result.rows[0].errorText).toBe('');

            // Check invalid row formatting
            expect(result.rows[1].statusClass).toBe('table-danger');
            expect(result.rows[1].statusIcon).toBe('bi-x-circle-fill');
            expect(result.rows[1].statusText).toBe('Error');
            expect(result.rows[1].formattedAmount).toMatch(/Rp\s*300\.000/);
            expect(result.rows[1].errorText).toBe('Member not found');
        });

        test('should limit preview rows when data exceeds maxPreviewRows', () => {
            const largeData = Array.from({ length: 150 }, (_, i) => ({
                rowNumber: i + 1,
                memberNumber: `00${i + 1}`,
                memberName: `User ${i + 1}`,
                paymentType: 'hutang',
                amount: 1000,
                description: 'Test',
                isValid: true,
                validationErrors: []
            }));

            const result = generator.generatePreviewTable(largeData);

            expect(result.rows).toHaveLength(100);
            expect(result.hasMore).toBe(true);
            expect(result.totalRows).toBe(150);
            expect(result.showingRows).toBe(100);
        });
    });

    describe('calculateSummary', () => {
        test('should calculate correct summary statistics', () => {
            const data = [
                { isValid: true, paymentType: 'hutang', amount: 500000 },
                { isValid: true, paymentType: 'piutang', amount: 300000 },
                { isValid: false, paymentType: 'hutang', amount: 200000 },
                { isValid: true, paymentType: 'hutang', amount: 100000 }
            ];

            const summary = generator.calculateSummary(data);

            expect(summary.totalRows).toBe(4);
            expect(summary.validRows).toBe(3);
            expect(summary.invalidRows).toBe(1);
            expect(summary.validPercentage).toBe('75.0');
            expect(summary.totalAmount).toBe(900000);
            expect(summary.totalHutang).toBe(600000);
            expect(summary.totalPiutang).toBe(300000);
            expect(summary.hutangCount).toBe(2);
            expect(summary.piutangCount).toBe(1);
            expect(summary.formattedTotalAmount).toMatch(/Rp\s*900\.000/);
        });

        test('should handle empty data', () => {
            const summary = generator.calculateSummary([]);

            expect(summary.totalRows).toBe(0);
            expect(summary.validRows).toBe(0);
            expect(summary.invalidRows).toBe(0);
            expect(summary.validPercentage).toBe('0');
            expect(summary.totalAmount).toBe(0);
        });
    });

    describe('highlightErrors', () => {
        test('should categorize and count errors correctly', () => {
            const data = [
                { isValid: true, validationErrors: [] },
                { isValid: false, rowNumber: 2, validationErrors: ['Member not found'] },
                { isValid: false, rowNumber: 3, validationErrors: ['Member not found', 'Invalid amount'] },
                { isValid: false, rowNumber: 4, validationErrors: ['Invalid amount'] }
            ];

            const errors = generator.highlightErrors(data);

            expect(errors.totalErrors).toBe(2);
            expect(errors.totalErrorRows).toBe(3);
            expect(errors.errorTypes['Member not found'].count).toBe(2);
            expect(errors.errorTypes['Invalid amount'].count).toBe(2);
            expect(errors.errorSummary).toHaveLength(2);
        });
    });

    describe('generateCompletePreview', () => {
        test('should generate complete preview with all components', () => {
            const validatedData = [
                {
                    rowNumber: 1,
                    memberNumber: '001',
                    memberName: 'John Doe',
                    paymentType: 'hutang',
                    amount: 500000,
                    description: 'Test payment',
                    isValid: true,
                    validationErrors: []
                }
            ];

            const preview = generator.generateCompletePreview(validatedData);

            expect(preview).toHaveProperty('table');
            expect(preview).toHaveProperty('summary');
            expect(preview).toHaveProperty('errors');
            expect(preview).toHaveProperty('canProceed');
            expect(preview).toHaveProperty('warnings');
            expect(preview.canProceed).toBe(true);
        });

        test('should set canProceed to false when no valid rows', () => {
            const validatedData = [
                {
                    rowNumber: 1,
                    memberNumber: '001',
                    memberName: 'John Doe',
                    paymentType: 'hutang',
                    amount: 500000,
                    description: 'Test payment',
                    isValid: false,
                    validationErrors: ['Member not found']
                }
            ];

            const preview = generator.generateCompletePreview(validatedData);
            expect(preview.canProceed).toBe(false);
        });
    });

    describe('generateWarnings', () => {
        test('should generate appropriate warnings', () => {
            const summaryWithInvalid = {
                validRows: 2,
                invalidRows: 1,
                totalAmount: 50000000
            };
            const errorsWithInvalid = { totalErrorRows: 1 };

            const warnings = generator.generateWarnings(summaryWithInvalid, errorsWithInvalid);

            expect(warnings).toHaveLength(1);
            expect(warnings[0].type).toBe('warning');
            expect(warnings[0].message).toContain('1 baris data tidak valid');
        });

        test('should warn about large amounts', () => {
            const summaryLargeAmount = {
                validRows: 1,
                invalidRows: 0,
                totalAmount: 150000000 // 150 million
            };
            const errorsEmpty = { totalErrorRows: 0 };

            const warnings = generator.generateWarnings(summaryLargeAmount, errorsEmpty);

            expect(warnings.some(w => w.message.includes('Total pembayaran sangat besar'))).toBe(true);
        });

        test('should warn when no valid rows', () => {
            const summaryNoValid = {
                validRows: 0,
                invalidRows: 2,
                totalAmount: 0
            };
            const errorsWithInvalid = { totalErrorRows: 2 };

            const warnings = generator.generateWarnings(summaryNoValid, errorsWithInvalid);

            expect(warnings.some(w => w.type === 'danger' && w.message.includes('Tidak ada data valid'))).toBe(true);
        });
    });

    describe('Property 4: Preview generation completeness', () => {
        /**
         * **Feature: import-tagihan-pembayaran, Property 4: Preview generation completeness**
         * For any validated import data, the preview should display all rows with validation status, 
         * accurate summary calculations, and error details for invalid rows
         * **Validates: Requirements 4.1, 4.2, 4.3**
         */
        test('should generate complete and accurate previews for any validated data', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            rowNumber: fc.integer({ min: 1, max: 1000 }),
                            memberNumber: fc.string({ minLength: 1, maxLength: 10 }),
                            memberName: fc.string({ minLength: 1, maxLength: 50 }),
                            paymentType: fc.oneof(fc.constant('hutang'), fc.constant('piutang')),
                            amount: fc.integer({ min: 1, max: 10000000 }),
                            description: fc.string({ minLength: 0, maxLength: 100 }),
                            isValid: fc.boolean(),
                            validationErrors: fc.array(
                                fc.string({ minLength: 1, maxLength: 50 }), 
                                { maxLength: 3 }
                            )
                        }),
                        { minLength: 0, maxLength: 200 }
                    ),
                    (validatedData) => {
                        const preview = generator.generateCompletePreview(validatedData);

                        // Verify preview structure completeness
                        const hasRequiredProperties = (
                            preview.hasOwnProperty('table') &&
                            preview.hasOwnProperty('summary') &&
                            preview.hasOwnProperty('errors') &&
                            preview.hasOwnProperty('canProceed') &&
                            preview.hasOwnProperty('warnings')
                        );

                        if (!hasRequiredProperties) return false;

                        // Verify table completeness
                        const tableValid = (
                            preview.table.totalRows === validatedData.length &&
                            preview.table.showingRows === Math.min(validatedData.length, generator.maxPreviewRows) &&
                            preview.table.hasMore === (validatedData.length > generator.maxPreviewRows) &&
                            preview.table.rows.length === Math.min(validatedData.length, generator.maxPreviewRows)
                        );

                        if (!tableValid) return false;

                        // Verify summary accuracy
                        const validRows = validatedData.filter(row => row.isValid);
                        const invalidRows = validatedData.filter(row => !row.isValid);
                        const hutangRows = validRows.filter(row => row.paymentType === 'hutang');
                        const piutangRows = validRows.filter(row => row.paymentType === 'piutang');
                        const totalAmount = validRows.reduce((sum, row) => sum + row.amount, 0);

                        const summaryValid = (
                            preview.summary.totalRows === validatedData.length &&
                            preview.summary.validRows === validRows.length &&
                            preview.summary.invalidRows === invalidRows.length &&
                            preview.summary.totalAmount === totalAmount &&
                            preview.summary.hutangCount === hutangRows.length &&
                            preview.summary.piutangCount === piutangRows.length
                        );

                        if (!summaryValid) return false;

                        // Verify error details for invalid rows
                        const errorRowsCount = invalidRows.length;
                        const errorsValid = (
                            preview.errors.totalErrorRows === errorRowsCount
                        );

                        if (!errorsValid) return false;

                        // Verify canProceed logic
                        const canProceedValid = preview.canProceed === (validRows.length > 0);

                        if (!canProceedValid) return false;

                        // Verify all table rows have proper validation status display
                        const displayedRows = preview.table.rows;
                        const statusDisplayValid = displayedRows.every(row => {
                            const hasStatusClass = row.hasOwnProperty('statusClass');
                            const hasStatusIcon = row.hasOwnProperty('statusIcon');
                            const hasStatusText = row.hasOwnProperty('statusText');
                            const hasFormattedAmount = row.hasOwnProperty('formattedAmount');
                            const hasErrorText = row.hasOwnProperty('errorText');

                            const correctStatusForValid = row.isValid ? 
                                (row.statusClass === 'table-success' && 
                                 row.statusIcon === 'bi-check-circle-fill' && 
                                 row.statusText === 'Valid') :
                                (row.statusClass === 'table-danger' && 
                                 row.statusIcon === 'bi-x-circle-fill' && 
                                 row.statusText === 'Error');

                            return hasStatusClass && hasStatusIcon && hasStatusText && 
                                   hasFormattedAmount && hasErrorText && correctStatusForValid;
                        });

                        return statusDisplayValid;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Method Signatures', () => {
        test('should have all required methods', () => {
            expect(typeof generator.generatePreviewTable).toBe('function');
            expect(typeof generator.calculateSummary).toBe('function');
            expect(typeof generator.highlightErrors).toBe('function');
            expect(typeof generator.formatCurrency).toBe('function');
            expect(typeof generator.generateCompletePreview).toBe('function');
            expect(typeof generator.generateWarnings).toBe('function');
        });
    });
});