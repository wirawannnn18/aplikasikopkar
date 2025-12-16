/**
 * Master Barang Komprehensif - Data Validator
 * Field-level validation utilities
 */

export class DataValidator {
    /**
     * Validate required field
     * @param {any} value - Value to validate
     * @param {string} fieldName - Field name for error message
     * @returns {Object} Validation result
     */
    static validateRequired(value, fieldName) {
        const isEmpty = value === null || value === undefined || 
                       (typeof value === 'string' && value.trim() === '') ||
                       (Array.isArray(value) && value.length === 0);
        
        return {
            isValid: !isEmpty,
            error: isEmpty ? `${fieldName} harus diisi` : null
        };
    }

    /**
     * Validate string length
     * @param {string} value - String to validate
     * @param {number} minLength - Minimum length
     * @param {number} maxLength - Maximum length
     * @param {string} fieldName - Field name for error message
     * @returns {Object} Validation result
     */
    static validateStringLength(value, minLength, maxLength, fieldName) {
        if (typeof value !== 'string') {
            return {
                isValid: false,
                error: `${fieldName} harus berupa teks`
            };
        }

        const length = value.trim().length;
        
        if (length < minLength) {
            return {
                isValid: false,
                error: `${fieldName} minimal ${minLength} karakter`
            };
        }
        
        if (length > maxLength) {
            return {
                isValid: false,
                error: `${fieldName} maksimal ${maxLength} karakter`
            };
        }

        return { isValid: true, error: null };
    }

    /**
     * Validate number range
     * @param {any} value - Value to validate
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {string} fieldName - Field name for error message
     * @returns {Object} Validation result
     */
    static validateNumberRange(value, min, max, fieldName) {
        const num = Number(value);
        
        if (isNaN(num)) {
            return {
                isValid: false,
                error: `${fieldName} harus berupa angka`
            };
        }
        
        if (num < min) {
            return {
                isValid: false,
                error: `${fieldName} tidak boleh kurang dari ${min.toLocaleString()}`
            };
        }
        
        if (num > max) {
            return {
                isValid: false,
                error: `${fieldName} tidak boleh lebih dari ${max.toLocaleString()}`
            };
        }

        return { isValid: true, error: null };
    }

    /**
     * Validate positive number
     * @param {any} value - Value to validate
     * @param {string} fieldName - Field name for error message
     * @param {boolean} allowZero - Whether zero is allowed
     * @returns {Object} Validation result
     */
    static validatePositiveNumber(value, fieldName, allowZero = true) {
        const num = Number(value);
        
        if (isNaN(num)) {
            return {
                isValid: false,
                error: `${fieldName} harus berupa angka`
            };
        }
        
        const minValue = allowZero ? 0 : 0.01;
        if (num < minValue) {
            return {
                isValid: false,
                error: `${fieldName} harus ${allowZero ? 'positif atau nol' : 'lebih dari nol'}`
            };
        }

        return { isValid: true, error: null };
    }
    /**
     * Validate pattern match
     * @param {string} value - Value to validate
     * @param {RegExp} pattern - Pattern to match
     * @param {string} fieldName - Field name for error message
     * @param {string} patternDescription - Description of pattern
     * @returns {Object} Validation result
     */
    static validatePattern(value, pattern, fieldName, patternDescription) {
        if (typeof value !== 'string') {
            return {
                isValid: false,
                error: `${fieldName} harus berupa teks`
            };
        }

        if (!pattern.test(value)) {
            return {
                isValid: false,
                error: `${fieldName} ${patternDescription}`
            };
        }

        return { isValid: true, error: null };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {Object} Validation result
     */
    static validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.validatePattern(
            email, 
            emailPattern, 
            'Email', 
            'format tidak valid'
        );
    }

    /**
     * Validate phone number format
     * @param {string} phone - Phone number to validate
     * @returns {Object} Validation result
     */
    static validatePhone(phone) {
        const phonePattern = /^[\d\s\-\+\(\)]+$/;
        return this.validatePattern(
            phone, 
            phonePattern, 
            'Nomor telepon', 
            'hanya boleh mengandung angka, spasi, tanda hubung, dan tanda kurung'
        );
    }

    /**
     * Validate date format
     * @param {any} date - Date to validate
     * @param {string} fieldName - Field name for error message
     * @returns {Object} Validation result
     */
    static validateDate(date, fieldName) {
        let dateObj;
        
        if (date instanceof Date) {
            dateObj = date;
        } else if (typeof date === 'string') {
            dateObj = new Date(date);
        } else {
            return {
                isValid: false,
                error: `${fieldName} format tidak valid`
            };
        }

        if (isNaN(dateObj.getTime())) {
            return {
                isValid: false,
                error: `${fieldName} format tidak valid`
            };
        }

        return { isValid: true, error: null };
    }

    /**
     * Validate array of values
     * @param {Array} values - Array to validate
     * @param {Function} validator - Validator function for each item
     * @param {string} fieldName - Field name for error message
     * @returns {Object} Validation result
     */
    static validateArray(values, validator, fieldName) {
        if (!Array.isArray(values)) {
            return {
                isValid: false,
                error: `${fieldName} harus berupa array`
            };
        }

        const errors = [];
        
        values.forEach((value, index) => {
            const result = validator(value, `${fieldName}[${index}]`);
            if (!result.isValid) {
                errors.push(result.error);
            }
        });

        return {
            isValid: errors.length === 0,
            error: errors.length > 0 ? errors.join(', ') : null,
            errors
        };
    }

    /**
     * Validate object properties
     * @param {Object} obj - Object to validate
     * @param {Object} schema - Validation schema
     * @returns {Object} Validation result
     */
    static validateObject(obj, schema) {
        const errors = [];
        const warnings = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = obj[field];
            
            // Check required fields
            if (rules.required) {
                const requiredResult = this.validateRequired(value, field);
                if (!requiredResult.isValid) {
                    errors.push(requiredResult.error);
                    continue; // Skip other validations if required field is missing
                }
            }

            // Skip validation if field is not present and not required
            if (value === undefined || value === null) {
                continue;
            }

            // Apply field-specific validations
            if (rules.type === 'string' && rules.minLength !== undefined && rules.maxLength !== undefined) {
                const lengthResult = this.validateStringLength(value, rules.minLength, rules.maxLength, field);
                if (!lengthResult.isValid) {
                    errors.push(lengthResult.error);
                }
            }

            if (rules.type === 'number') {
                if (rules.positive) {
                    const positiveResult = this.validatePositiveNumber(value, field, rules.allowZero);
                    if (!positiveResult.isValid) {
                        errors.push(positiveResult.error);
                    }
                }
                
                if (rules.min !== undefined && rules.max !== undefined) {
                    const rangeResult = this.validateNumberRange(value, rules.min, rules.max, field);
                    if (!rangeResult.isValid) {
                        errors.push(rangeResult.error);
                    }
                }
            }

            if (rules.pattern) {
                const patternResult = this.validatePattern(value, rules.pattern, field, rules.patternDescription || 'format tidak valid');
                if (!patternResult.isValid) {
                    errors.push(patternResult.error);
                }
            }

            // Custom validator
            if (rules.validator && typeof rules.validator === 'function') {
                const customResult = rules.validator(value, field, obj);
                if (!customResult.isValid) {
                    errors.push(customResult.error);
                }
                if (customResult.warnings) {
                    warnings.push(...customResult.warnings);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Sanitize input data
     * @param {any} value - Value to sanitize
     * @param {string} type - Data type
     * @returns {any} Sanitized value
     */
    static sanitize(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string' ? value.trim() : String(value || '');
            
            case 'number':
                const num = Number(value);
                return isNaN(num) ? 0 : num;
            
            case 'boolean':
                return Boolean(value);
            
            case 'array':
                return Array.isArray(value) ? value : [];
            
            default:
                return value;
        }
    }

    /**
     * Create validation schema for barang
     * @returns {Object} Barang validation schema
     */
    static getBarangSchema() {
        return {
            kode: {
                required: true,
                type: 'string',
                minLength: 2,
                maxLength: 20,
                pattern: /^[A-Za-z0-9\-]+$/,
                patternDescription: 'hanya boleh mengandung huruf, angka, dan tanda hubung'
            },
            nama: {
                required: true,
                type: 'string',
                minLength: 2,
                maxLength: 100
            },
            kategori_id: {
                required: true,
                type: 'string'
            },
            satuan_id: {
                required: true,
                type: 'string'
            },
            harga_beli: {
                type: 'number',
                positive: true,
                allowZero: true,
                min: 0,
                max: 999999999
            },
            harga_jual: {
                type: 'number',
                positive: true,
                allowZero: true,
                min: 0,
                max: 999999999
            },
            stok: {
                type: 'number',
                positive: true,
                allowZero: true,
                min: 0,
                max: 999999999
            },
            stok_minimum: {
                type: 'number',
                positive: true,
                allowZero: true,
                min: 0,
                max: 999999999
            }
        };
    }

    /**
     * Create validation schema for kategori
     * @returns {Object} Kategori validation schema
     */
    static getKategoriSchema() {
        return {
            nama: {
                required: true,
                type: 'string',
                minLength: 2,
                maxLength: 50
            },
            deskripsi: {
                type: 'string',
                maxLength: 200
            }
        };
    }

    /**
     * Create validation schema for satuan
     * @returns {Object} Satuan validation schema
     */
    static getSatuanSchema() {
        return {
            nama: {
                required: true,
                type: 'string',
                minLength: 1,
                maxLength: 20
            },
            deskripsi: {
                type: 'string',
                maxLength: 100
            }
        };
    }
}