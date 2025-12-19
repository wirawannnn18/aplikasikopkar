/**
 * Validation Engine - Validates import data against business rules
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

// Import PaymentSystemIntegration and SecurityValidator - conditional import for different environments
let PaymentSystemIntegration, SecurityValidator;
if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        PaymentSystemIntegration = require('./PaymentSystemIntegration.js').PaymentSystemIntegration;
        SecurityValidator = require('./SecurityValidator.js').SecurityValidator;
    } catch (e) {
        // Fallback if require fails
        PaymentSystemIntegration = null;
        SecurityValidator = null;
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    PaymentSystemIntegration = window.PaymentSystemIntegration;
    SecurityValidator = window.SecurityValidator;
}

/**
 * Validation engine for import data
 * Validates member data, payment types, and amounts using integrated payment system
 */
class ValidationEngine {
    constructor() {
        this.validPaymentTypes = ['hutang', 'piutang'];
        
        // Initialize PaymentSystemIntegration for compatibility with existing validation
        // Requirements: 11.1 - Reuse existing validation and journal logic
        if (PaymentSystemIntegration) {
            this.paymentIntegration = new PaymentSystemIntegration();
        } else {
            console.warn('PaymentSystemIntegration not available, using fallback validation logic');
            this.paymentIntegration = null;
        }
        
        // Initialize SecurityValidator for input sanitization
        // Requirements: 8.1 - Implement input sanitization
        if (SecurityValidator) {
            this.securityValidator = new SecurityValidator();
        } else {
            console.warn('SecurityValidator not available, using basic validation');
            this.securityValidator = null;
        }
    }

    /**
     * Validate a single data row with input sanitization
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1 - Input sanitization
     * @param {Object} rowData - Single row data
     * @param {number} rowNumber - Row number for error reporting
     * @returns {Promise<ImportRow>} Validated row with status
     */
    async validateRow(rowData, rowNumber) {
        const errors = [];
        let sanitizedData = { ...rowData };
        
        // Sanitize input data first
        // Requirements: 8.1 - Implement input sanitization
        if (this.securityValidator) {
            const sanitizationResults = {};
            
            // Sanitize each field
            const fieldsToSanitize = [
                { key: 'nomor_anggota', fieldName: 'memberNumber' },
                { key: 'nama_anggota', fieldName: 'memberName' },
                { key: 'jenis_pembayaran', fieldName: 'paymentType' },
                { key: 'jumlah_pembayaran', fieldName: 'amount' },
                { key: 'keterangan', fieldName: 'description' }
            ];
            
            fieldsToSanitize.forEach(field => {
                const sanitizationResult = this.securityValidator.sanitizeAndValidateInput(
                    rowData[field.key], 
                    field.fieldName
                );
                
                sanitizationResults[field.key] = sanitizationResult;
                
                if (sanitizationResult.isValid) {
                    sanitizedData[field.key] = sanitizationResult.sanitizedValue;
                } else {
                    errors.push(...sanitizationResult.errors.map(err => `${field.key}: ${err}`));
                }
                
                // Add warnings as validation errors for security
                if (sanitizationResult.warnings.length > 0) {
                    errors.push(...sanitizationResult.warnings.map(warn => `${field.key}: ${warn}`));
                }
            });
        }
        
        // Continue with business logic validation only if sanitization passed
        if (errors.length === 0) {
            // Validate member number
            const memberValidation = await this.validateMember(sanitizedData.nomor_anggota);
            if (!memberValidation.valid) {
                errors.push(memberValidation.error);
            }

            // Validate payment type
            const paymentTypeValidation = this.validatePaymentType(sanitizedData.jenis_pembayaran);
            if (!paymentTypeValidation.valid) {
                errors.push(paymentTypeValidation.error);
            }

            // Validate amount
            const amountValidation = this.validateAmount(sanitizedData.jumlah_pembayaran);
            if (!amountValidation.valid) {
                errors.push(amountValidation.error);
            }

            // Validate amount against member balance if other validations pass
            if (memberValidation.valid && paymentTypeValidation.valid && amountValidation.valid) {
                const balanceValidation = await this.validateAmountAgainstBalance(
                    sanitizedData.nomor_anggota,
                    sanitizedData.jenis_pembayaran,
                    parseFloat(sanitizedData.jumlah_pembayaran)
                );
                if (!balanceValidation.valid) {
                    errors.push(balanceValidation.error);
                }
            }
        }

        return {
            rowNumber,
            memberNumber: sanitizedData.nomor_anggota || rowData.nomor_anggota,
            memberName: sanitizedData.nama_anggota || rowData.nama_anggota,
            paymentType: sanitizedData.jenis_pembayaran || rowData.jenis_pembayaran,
            amount: parseFloat(sanitizedData.jumlah_pembayaran) || 0,
            description: sanitizedData.keterangan || rowData.keterangan || '',
            isValid: errors.length === 0,
            validationErrors: errors,
            transactionId: null,
            processedAt: null,
            sanitized: this.securityValidator ? true : false
        };
    }

    /**
     * Validate member exists in database using integrated validation
     * Requirements: 3.1, 11.1 - Reuse existing validation and journal logic
     * @param {string} memberNumber - Member number to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateMember(memberNumber) {
        try {
            if (!memberNumber || typeof memberNumber !== 'string') {
                return {
                    valid: false,
                    error: 'Nomor anggota tidak boleh kosong'
                };
            }

            // Get member data from localStorage
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const member = anggotaList.find(a => a.id === memberNumber.trim());

            if (!member) {
                return {
                    valid: false,
                    error: `Anggota dengan nomor '${memberNumber}' tidak ditemukan`
                };
            }

            // Use PaymentSystemIntegration if available for consistent member validation
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            if (this.paymentIntegration) {
                const memberValidation = this.paymentIntegration.validateAnggotaForHutangPiutang(member.id);
                if (!memberValidation.valid) {
                    return {
                        valid: false,
                        error: memberValidation.error
                    };
                }
            } else {
                // Fallback validation
                // Check if member is active (not keluar)
                if (member.statusKeanggotaan === 'Keluar') {
                    return {
                        valid: false,
                        error: `Anggota '${memberNumber}' sudah keluar dari koperasi`
                    };
                }

                // Check if member status is active
                if (member.status !== 'Aktif') {
                    return {
                        valid: false,
                        error: `Anggota '${memberNumber}' tidak aktif dan tidak dapat melakukan transaksi`
                    };
                }
            }

            return { 
                valid: true,
                memberData: member
            };
        } catch (error) {
            return {
                valid: false,
                error: `Error validasi anggota: ${error.message}`
            };
        }
    }

    /**
     * Validate payment type
     * Requirements: 3.2
     * @param {string} paymentType - Payment type to validate
     * @returns {Object} Validation result
     */
    validatePaymentType(paymentType) {
        if (!paymentType) {
            return {
                valid: false,
                error: 'Jenis pembayaran tidak boleh kosong'
            };
        }

        const normalizedType = paymentType.toLowerCase().trim();
        if (!this.validPaymentTypes.includes(normalizedType)) {
            return {
                valid: false,
                error: `Jenis pembayaran harus 'hutang' atau 'piutang', ditemukan: '${paymentType}'`
            };
        }

        return { valid: true };
    }

    /**
     * Validate payment amount
     * Requirements: 3.3
     * @param {string|number} amount - Amount to validate
     * @returns {Object} Validation result
     */
    validateAmount(amount) {
        if (!amount && amount !== 0) {
            return {
                valid: false,
                error: 'Jumlah pembayaran tidak boleh kosong'
            };
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) {
            return {
                valid: false,
                error: `Jumlah pembayaran harus berupa angka, ditemukan: '${amount}'`
            };
        }

        if (numericAmount <= 0) {
            return {
                valid: false,
                error: 'Jumlah pembayaran harus lebih dari 0'
            };
        }

        return { valid: true };
    }

    /**
     * Validate amount against member balance using integrated payment system
     * Requirements: 3.4, 11.1 - Reuse existing validation and journal logic
     * @param {string} memberNumber - Member number
     * @param {string} paymentType - Payment type (hutang/piutang)
     * @param {number} amount - Payment amount
     * @returns {Promise<Object>} Validation result
     */
    async validateAmountAgainstBalance(memberNumber, paymentType, amount) {
        try {
            // Get member data first
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const member = anggotaList.find(a => a.id === memberNumber.trim());
            
            if (!member) {
                return {
                    valid: false,
                    error: `Anggota dengan nomor '${memberNumber}' tidak ditemukan`
                };
            }

            const normalizedType = paymentType.toLowerCase().trim();
            let currentBalance = 0;

            // Use PaymentSystemIntegration if available for consistency with existing balance calculations
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            if (this.paymentIntegration) {
                if (normalizedType === 'hutang') {
                    currentBalance = this.paymentIntegration.hitungSaldoHutang(member.id);
                } else if (normalizedType === 'piutang') {
                    currentBalance = this.paymentIntegration.hitungSaldoPiutang(member.id);
                }
            } else {
                // Fallback to direct function calls if available
                if (typeof hitungSaldoHutang !== 'undefined' && typeof hitungSaldoPiutang !== 'undefined') {
                    if (normalizedType === 'hutang') {
                        currentBalance = hitungSaldoHutang(member.id);
                    } else if (normalizedType === 'piutang') {
                        currentBalance = hitungSaldoPiutang(member.id);
                    }
                } else {
                    return {
                        valid: false,
                        error: 'Fungsi perhitungan saldo tidak tersedia'
                    };
                }
            }

            // Validate balance availability
            if (currentBalance <= 0) {
                const jenisText = normalizedType === 'hutang' ? 'hutang' : 'piutang';
                return {
                    valid: false,
                    error: `Anggota '${memberNumber}' tidak memiliki saldo ${jenisText}`
                };
            }

            // Validate amount against balance
            if (amount > currentBalance) {
                const jenisText = normalizedType === 'hutang' ? 'hutang' : 'piutang';
                return {
                    valid: false,
                    error: `Jumlah pembayaran (${amount.toLocaleString('id-ID')}) melebihi saldo ${jenisText} (${currentBalance.toLocaleString('id-ID')})`
                };
            }

            return { 
                valid: true,
                currentBalance: currentBalance
            };
        } catch (error) {
            return {
                valid: false,
                error: `Error validasi saldo: ${error.message}`
            };
        }
    }

    /**
     * Generate validation report
     * Requirements: 3.5
     * @param {Array<ImportRow>} validatedRows - All validated rows
     * @returns {Object} Validation summary
     */
    generateValidationReport(validatedRows) {
        const totalRows = validatedRows.length;
        const validRows = validatedRows.filter(row => row.isValid);
        const invalidRows = validatedRows.filter(row => !row.isValid);

        const errorSummary = {};
        invalidRows.forEach(row => {
            row.validationErrors.forEach(error => {
                errorSummary[error] = (errorSummary[error] || 0) + 1;
            });
        });

        return {
            totalRows,
            validCount: validRows.length,
            invalidCount: invalidRows.length,
            validPercentage: totalRows > 0 ? (validRows.length / totalRows * 100).toFixed(1) : '0',
            errorSummary,
            validRows,
            invalidRows
        };
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.ValidationEngine = ValidationEngine;
}

// Browser compatibility - exports handled via window object

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ValidationEngine };
}