/**
 * Validation Engine Tests
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import fc from 'fast-check';

// Import the class to test
let ValidationEngine;

beforeAll(async () => {
    // Dynamic import to handle ES modules
    const module = await import('../../js/import-tagihan/ValidationEngine.js');
    ValidationEngine = module.ValidationEngine;
});

describe('ValidationEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new ValidationEngine();
    });

    describe('Constructor', () => {
        test('should initialize with valid payment types', () => {
            expect(engine.validPaymentTypes).toEqual(['hutang', 'piutang']);
        });
    });

    describe('validatePaymentType', () => {
        test('should accept valid payment types', () => {
            expect(engine.validatePaymentType('hutang')).toEqual({ valid: true });
            expect(engine.validatePaymentType('piutang')).toEqual({ valid: true });
            expect(engine.validatePaymentType('HUTANG')).toEqual({ valid: true });
            expect(engine.validatePaymentType('PIUTANG')).toEqual({ valid: true });
            expect(engine.validatePaymentType(' hutang ')).toEqual({ valid: true });
        });

        test('should reject invalid payment types', () => {
            const result1 = engine.validatePaymentType('invalid');
            const result2 = engine.validatePaymentType('kredit');
            const result3 = engine.validatePaymentType('');
            const result4 = engine.validatePaymentType(null);

            expect(result1.valid).toBe(false);
            expect(result1.error).toContain('Jenis pembayaran harus');
            expect(result2.valid).toBe(false);
            expect(result3.valid).toBe(false);
            expect(result3.error).toContain('tidak boleh kosong');
            expect(result4.valid).toBe(false);
        });

        // Property-based test for payment type validation
        test('should validate payment types correctly', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant('hutang'),
                        fc.constant('piutang'),
                        fc.constant('HUTANG'),
                        fc.constant('PIUTANG'),
                        fc.constant(' hutang '),
                        fc.constant(' piutang '),
                        fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
                            const normalized = s.toLowerCase().trim();
                            return normalized !== '' && !['hutang', 'piutang'].includes(normalized);
                        }),
                        fc.constant(''),
                        fc.constant(null),
                        fc.constant(undefined)
                    ),
                    (paymentType) => {
                        const result = engine.validatePaymentType(paymentType);
                        const normalizedType = paymentType ? paymentType.toLowerCase().trim() : '';
                        
                        if (['hutang', 'piutang'].includes(normalizedType)) {
                            return result.valid === true;
                        } else {
                            return result.valid === false && typeof result.error === 'string' && result.error.length > 0;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('validateAmount', () => {
        test('should accept valid positive amounts', () => {
            expect(engine.validateAmount(100)).toEqual({ valid: true });
            expect(engine.validateAmount('100')).toEqual({ valid: true });
            expect(engine.validateAmount(0.01)).toEqual({ valid: true });
            expect(engine.validateAmount('1000.50')).toEqual({ valid: true });
        });

        test('should reject invalid amounts', () => {
            const result1 = engine.validateAmount(0);
            const result2 = engine.validateAmount(-100);
            const result3 = engine.validateAmount('invalid');
            const result4 = engine.validateAmount('');
            const result5 = engine.validateAmount(null);

            expect(result1.valid).toBe(false);
            expect(result1.error).toContain('harus lebih dari 0');
            expect(result2.valid).toBe(false);
            expect(result2.error).toContain('harus lebih dari 0');
            expect(result3.valid).toBe(false);
            expect(result3.error).toContain('harus berupa angka');
            expect(result4.valid).toBe(false);
            expect(result4.error).toContain('tidak boleh kosong');
            expect(result5.valid).toBe(false);
        });

        // Property-based test for amount validation
        test('should validate amounts correctly', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000) }),
                        fc.float({ min: Math.fround(-1000000), max: Math.fround(0) }),
                        fc.string().filter(s => isNaN(parseFloat(s))),
                        fc.constant(''),
                        fc.constant(null)
                    ),
                    (amount) => {
                        const result = engine.validateAmount(amount);
                        
                        if (amount === null || amount === '' || amount === undefined) {
                            return result.valid === false && result.error.includes('tidak boleh kosong');
                        }
                        
                        const numericAmount = parseFloat(amount);
                        if (isNaN(numericAmount)) {
                            return result.valid === false && result.error.includes('harus berupa angka');
                        }
                        
                        if (numericAmount <= 0) {
                            return result.valid === false && result.error.includes('harus lebih dari 0');
                        }
                        
                        return result.valid === true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('generateValidationReport', () => {
        test('should generate correct validation report', () => {
            const validatedRows = [
                { isValid: true, validationErrors: [] },
                { isValid: false, validationErrors: ['Error 1'] },
                { isValid: false, validationErrors: ['Error 1', 'Error 2'] },
                { isValid: true, validationErrors: [] }
            ];

            const report = engine.generateValidationReport(validatedRows);

            expect(report.totalRows).toBe(4);
            expect(report.validCount).toBe(2);
            expect(report.invalidCount).toBe(2);
            expect(report.validPercentage).toBe('50.0');
            expect(report.errorSummary['Error 1']).toBe(2);
            expect(report.errorSummary['Error 2']).toBe(1);
            expect(report.validRows).toHaveLength(2);
            expect(report.invalidRows).toHaveLength(2);
        });

        test('should handle empty validation results', () => {
            const report = engine.generateValidationReport([]);
            
            expect(report.totalRows).toBe(0);
            expect(report.validCount).toBe(0);
            expect(report.invalidCount).toBe(0);
            expect(report.validPercentage).toBe('0');
            expect(report.errorSummary).toEqual({});
        });

        // Property-based test for validation report generation
        test('should generate consistent validation reports', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            isValid: fc.boolean(),
                            validationErrors: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 })
                        }),
                        { maxLength: 100 }
                    ),
                    (validatedRows) => {
                        const report = engine.generateValidationReport(validatedRows);
                        
                        const expectedValid = validatedRows.filter(row => row.isValid).length;
                        const expectedInvalid = validatedRows.filter(row => !row.isValid).length;
                        
                        return (
                            report.totalRows === validatedRows.length &&
                            report.validCount === expectedValid &&
                            report.invalidCount === expectedInvalid &&
                            report.validRows.length === expectedValid &&
                            report.invalidRows.length === expectedInvalid &&
                            (validatedRows.length === 0 ? 
                                report.validPercentage === '0' : 
                                parseFloat(report.validPercentage) >= 0 && parseFloat(report.validPercentage) <= 100)
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 3: Data validation accuracy', () => {
        /**
         * **Feature: import-tagihan-pembayaran, Property 3: Data validation accuracy**
         * For any import data row, the system should validate member existence, payment type (hutang/piutang only), 
         * positive amount values, and amount not exceeding member balance, marking invalid rows appropriately
         * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
         */
        test('should accurately validate synchronous data aspects for import rows', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        nomor_anggota: fc.oneof(
                            fc.string({ minLength: 1, maxLength: 10 }), // Valid member numbers
                            fc.constant(''), // Empty member number
                            fc.constant(null) // Null member number
                        ),
                        nama_anggota: fc.string({ minLength: 0, maxLength: 50 }),
                        jenis_pembayaran: fc.oneof(
                            fc.constant('hutang'),
                            fc.constant('piutang'),
                            fc.constant('HUTANG'),
                            fc.constant('PIUTANG'),
                            fc.constant(' hutang '),
                            fc.constant('invalid_type'),
                            fc.constant(''),
                            fc.constant(null)
                        ),
                        jumlah_pembayaran: fc.oneof(
                            fc.integer({ min: 1, max: 1000000 }).map(n => n.toString()),
                            fc.integer({ min: -1000, max: 0 }).map(n => n.toString()),
                            fc.constant('0'),
                            fc.constant('invalid_amount'),
                            fc.constant(''),
                            fc.constant(null)
                        ),
                        keterangan: fc.string({ minLength: 0, maxLength: 100 })
                    }),
                    (rowData) => {
                        // Test individual validation methods that are synchronous
                        
                        // Test payment type validation
                        const paymentTypeResult = engine.validatePaymentType(rowData.jenis_pembayaran);
                        const expectedPaymentTypeValid = rowData.jenis_pembayaran && 
                                                        ['hutang', 'piutang'].includes(rowData.jenis_pembayaran.toLowerCase().trim());
                        
                        if (expectedPaymentTypeValid) {
                            expect(paymentTypeResult.valid).toBe(true);
                        } else {
                            expect(paymentTypeResult.valid).toBe(false);
                            expect(paymentTypeResult.error).toBeTruthy();
                        }

                        // Test amount validation
                        const amountResult = engine.validateAmount(rowData.jumlah_pembayaran);
                        const expectedAmountValid = rowData.jumlah_pembayaran && 
                                                  !isNaN(parseFloat(rowData.jumlah_pembayaran)) && 
                                                  parseFloat(rowData.jumlah_pembayaran) > 0;
                        
                        if (expectedAmountValid) {
                            expect(amountResult.valid).toBe(true);
                        } else {
                            expect(amountResult.valid).toBe(false);
                            expect(amountResult.error).toBeTruthy();
                        }

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Method Signatures', () => {
        test('should have all required methods', () => {
            expect(typeof engine.validateRow).toBe('function');
            expect(typeof engine.validateMember).toBe('function');
            expect(typeof engine.validatePaymentType).toBe('function');
            expect(typeof engine.validateAmount).toBe('function');
            expect(typeof engine.validateAmountAgainstBalance).toBe('function');
            expect(typeof engine.generateValidationReport).toBe('function');
        });

        test('validateRow should create proper ImportRow structure', async () => {
            const mockRowData = {
                nomor_anggota: '123',
                nama_anggota: 'Test User',
                jenis_pembayaran: 'hutang',
                jumlah_pembayaran: '1000',
                keterangan: 'Test payment'
            };

            // Mock the async methods to avoid "not implemented" errors
            const originalValidateMember = engine.validateMember;
            const originalValidateAmountAgainstBalance = engine.validateAmountAgainstBalance;
            
            engine.validateMember = async () => ({ valid: true });
            engine.validateAmountAgainstBalance = async () => ({ valid: true });

            const result = await engine.validateRow(mockRowData, 1);

            expect(result).toMatchObject({
                rowNumber: 1,
                memberNumber: '123',
                memberName: 'Test User',
                paymentType: 'hutang',
                amount: 1000,
                description: 'Test payment',
                isValid: true,
                validationErrors: [],
                transactionId: null,
                processedAt: null
            });

            // Restore original methods
            engine.validateMember = originalValidateMember;
            engine.validateAmountAgainstBalance = originalValidateAmountAgainstBalance;
        });
    });
});