/**
 * Security Validator - Handles security validation for import processing
 * Requirements: 8.1, 9.1
 */

/**
 * Security validation utilities for file upload and input sanitization
 * Implements comprehensive security measures for import functionality
 */
class SecurityValidator {
    constructor() {
        // File security configuration
        this.allowedMimeTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/csv',
            'text/plain'
        ];
        
        this.allowedExtensions = ['csv', 'xlsx', 'xls'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.maxRowCount = 10000; // Maximum rows per import
        
        // Malicious file patterns
        this.maliciousPatterns = [
            /(<script[\s\S]*?>[\s\S]*?<\/script>)/gi,
            /(<iframe[\s\S]*?>[\s\S]*?<\/iframe>)/gi,
            /(javascript:)/gi,
            /(vbscript:)/gi,
            /(onload\s*=)/gi,
            /(onerror\s*=)/gi,
            /(onclick\s*=)/gi,
            /(eval\s*\()/gi,
            /(document\.cookie)/gi,
            /(window\.location)/gi,
            /(\bexec\b)/gi,
            /(\bsystem\b)/gi,
            /(\bshell_exec\b)/gi
        ];
        
        // SQL injection patterns
        this.sqlInjectionPatterns = [
            /(union\s+select)/gi,
            /(drop\s+table)/gi,
            /(delete\s+from)/gi,
            /(insert\s+into)/gi,
            /(update\s+set)/gi,
            /(';\s*drop)/gi,
            /(';\s*delete)/gi,
            /(';\s*insert)/gi,
            /(';\s*update)/gi,
            /(--\s*$)/gm,
            /(\*\/)/gi
        ];
        
        // XSS patterns
        this.xssPatterns = [
            /(<script[^>]*>.*?<\/script>)/gi,
            /(<img[^>]*onerror[^>]*>)/gi,
            /(<svg[^>]*onload[^>]*>)/gi,
            /(javascript:)/gi,
            /(vbscript:)/gi,
            /(data:text\/html)/gi,
            /(<object[^>]*>)/gi,
            /(<embed[^>]*>)/gi
        ];
        
        // Input validation rules
        this.validationRules = {
            memberNumber: {
                maxLength: 50,
                pattern: /^[a-zA-Z0-9\-_]+$/,
                required: true
            },
            memberName: {
                maxLength: 100,
                pattern: /^[a-zA-Z\s\.\-']+$/,
                required: true
            },
            paymentType: {
                allowedValues: ['hutang', 'piutang'],
                required: true
            },
            amount: {
                min: 0.01,
                max: 999999999.99,
                required: true
            },
            description: {
                maxLength: 500,
                required: false
            }
        };
    }

    /**
     * Comprehensive file upload security validation
     * Requirements: 8.1 - Add file upload security validation
     * @param {File} file - File to validate
     * @returns {Object} Security validation result
     */
    validateFileUploadSecurity(file) {
        const results = {
            isSecure: true,
            warnings: [],
            errors: [],
            riskLevel: 'low'
        };

        try {
            // 1. File type validation
            const mimeTypeResult = this._validateMimeType(file);
            if (!mimeTypeResult.valid) {
                results.errors.push(mimeTypeResult.error);
                results.isSecure = false;
                results.riskLevel = 'high';
            }

            // 2. File extension validation
            const extensionResult = this._validateFileExtension(file);
            if (!extensionResult.valid) {
                results.errors.push(extensionResult.error);
                results.isSecure = false;
                results.riskLevel = 'high';
            }

            // 3. File size validation
            const sizeResult = this._validateFileSize(file);
            if (!sizeResult.valid) {
                results.errors.push(sizeResult.error);
                results.isSecure = false;
                results.riskLevel = 'medium';
            }

            // 4. File name validation
            const nameResult = this._validateFileName(file.name);
            if (!nameResult.valid) {
                results.warnings.push(nameResult.warning);
                if (nameResult.severity === 'high') {
                    results.errors.push(nameResult.error);
                    results.isSecure = false;
                    results.riskLevel = 'high';
                }
            }

            // 5. File header validation (magic bytes)
            const headerResult = this._validateFileHeader(file);
            if (!headerResult.valid) {
                results.errors.push(headerResult.error);
                results.isSecure = false;
                results.riskLevel = 'high';
            }

        } catch (error) {
            results.errors.push(`Security validation error: ${error.message}`);
            results.isSecure = false;
            results.riskLevel = 'high';
        }

        return results;
    }

    /**
     * Sanitize and validate input data
     * Requirements: 8.1 - Implement input sanitization
     * @param {Object} inputData - Raw input data
     * @param {string} fieldName - Field name for validation rules
     * @returns {Object} Sanitized and validated data
     */
    sanitizeAndValidateInput(inputData, fieldName) {
        const result = {
            sanitizedValue: null,
            isValid: true,
            errors: [],
            warnings: []
        };

        try {
            if (inputData === null || inputData === undefined) {
                const rule = this.validationRules[fieldName];
                if (rule && rule.required) {
                    result.errors.push(`${fieldName} is required`);
                    result.isValid = false;
                }
                return result;
            }

            let sanitizedValue = String(inputData).trim();

            // 1. Remove malicious patterns
            sanitizedValue = this._removeMaliciousPatterns(sanitizedValue);

            // 2. Prevent SQL injection
            sanitizedValue = this._preventSQLInjection(sanitizedValue);

            // 3. Prevent XSS attacks
            sanitizedValue = this._preventXSS(sanitizedValue);

            // 4. Apply field-specific validation
            const validationResult = this._validateFieldSpecific(sanitizedValue, fieldName);
            if (!validationResult.valid) {
                result.errors.push(...validationResult.errors);
                result.warnings.push(...validationResult.warnings);
                result.isValid = false;
            }

            result.sanitizedValue = sanitizedValue;

        } catch (error) {
            result.errors.push(`Input sanitization error: ${error.message}`);
            result.isValid = false;
        }

        return result;
    }

    /**
     * Validate authentication and authorization for admin features
     * Requirements: 9.1 - Add authentication checks for admin features
     * @param {Object} user - Current user object
     * @param {string} requiredRole - Required role for the operation
     * @param {string} operation - Operation being performed
     * @returns {Object} Authorization result
     */
    validateAdminAuthentication(user, requiredRole = 'admin', operation = 'import_config') {
        const result = {
            isAuthorized: false,
            errors: [],
            warnings: [],
            userInfo: null
        };

        try {
            // 1. Check if user exists
            if (!user || typeof user !== 'object') {
                result.errors.push('User authentication required');
                return result;
            }

            // 2. Validate user session
            const sessionResult = this._validateUserSession(user);
            if (!sessionResult.valid) {
                result.errors.push(sessionResult.error);
                return result;
            }

            // 3. Check user role
            const roleResult = this._validateUserRole(user, requiredRole);
            if (!roleResult.valid) {
                result.errors.push(roleResult.error);
                return result;
            }

            // 4. Check operation permissions
            const permissionResult = this._validateOperationPermission(user, operation);
            if (!permissionResult.valid) {
                result.errors.push(permissionResult.error);
                return result;
            }

            // 5. Additional security checks
            const securityResult = this._performAdditionalSecurityChecks(user);
            if (!securityResult.valid) {
                result.warnings.push(...securityResult.warnings);
                if (securityResult.critical) {
                    result.errors.push(securityResult.error);
                    return result;
                }
            }

            result.isAuthorized = true;
            result.userInfo = {
                id: user.id,
                nama: user.nama,
                role: user.role,
                lastLogin: user.lastLogin
            };

        } catch (error) {
            result.errors.push(`Authentication validation error: ${error.message}`);
        }

        return result;
    }

    /**
     * Validate file content for malicious patterns
     * Requirements: 8.1 - File upload security validation
     * @param {string} content - File content to validate
     * @returns {Object} Content validation result
     */
    validateFileContent(content) {
        const result = {
            isSafe: true,
            threats: [],
            warnings: [],
            riskLevel: 'low'
        };

        try {
            // Check for malicious patterns
            this.maliciousPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    result.threats.push({
                        type: 'malicious_pattern',
                        pattern: pattern.toString(),
                        matches: matches.length,
                        severity: 'high'
                    });
                    result.isSafe = false;
                    result.riskLevel = 'high';
                }
            });

            // Check for SQL injection attempts
            this.sqlInjectionPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    result.threats.push({
                        type: 'sql_injection',
                        pattern: pattern.toString(),
                        matches: matches.length,
                        severity: 'high'
                    });
                    result.isSafe = false;
                    result.riskLevel = 'high';
                }
            });

            // Check for XSS attempts
            this.xssPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    result.threats.push({
                        type: 'xss_attempt',
                        pattern: pattern.toString(),
                        matches: matches.length,
                        severity: 'high'
                    });
                    result.isSafe = false;
                    result.riskLevel = 'high';
                }
            });

            // Check for suspicious file size patterns
            if (content.length > 1024 * 1024) { // 1MB
                result.warnings.push('Large file content detected - monitor for performance impact');
                if (result.riskLevel === 'low') {
                    result.riskLevel = 'medium';
                }
            }

        } catch (error) {
            result.threats.push({
                type: 'validation_error',
                error: error.message,
                severity: 'medium'
            });
            result.riskLevel = 'medium';
        }

        return result;
    }

    /**
     * Generate security audit log entry
     * Requirements: 8.1 - Security validation logging
     * @param {string} operation - Operation performed
     * @param {Object} user - User performing operation
     * @param {Object} validationResult - Security validation result
     * @returns {Object} Audit log entry
     */
    generateSecurityAuditLog(operation, user, validationResult) {
        return {
            timestamp: new Date().toISOString(),
            operation: operation,
            userId: user?.id || 'unknown',
            userName: user?.nama || 'Unknown User',
            userRole: user?.role || 'unknown',
            ipAddress: this._getClientIP(),
            userAgent: this._getUserAgent(),
            validationResult: {
                isSecure: validationResult.isSecure || validationResult.isSafe,
                riskLevel: validationResult.riskLevel,
                threatsDetected: validationResult.threats?.length || validationResult.errors?.length || 0,
                warningsCount: validationResult.warnings?.length || 0
            },
            details: validationResult
        };
    }

    // Private validation methods

    /**
     * Validate MIME type
     * @private
     */
    _validateMimeType(file) {
        if (!this.allowedMimeTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Tipe file tidak diizinkan: ${file.type}. Hanya diizinkan: ${this.allowedMimeTypes.join(', ')}`
            };
        }
        return { valid: true };
    }

    /**
     * Validate file extension
     * @private
     */
    _validateFileExtension(file) {
        const extension = file.name.toLowerCase().split('.').pop();
        if (!this.allowedExtensions.includes(extension)) {
            return {
                valid: false,
                error: `Ekstensi file tidak diizinkan: .${extension}. Hanya diizinkan: ${this.allowedExtensions.map(ext => '.' + ext).join(', ')}`
            };
        }
        return { valid: true };
    }

    /**
     * Validate file size
     * @private
     */
    _validateFileSize(file) {
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `Ukuran file terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal: ${this.maxFileSize / 1024 / 1024}MB`
            };
        }
        if (file.size === 0) {
            return {
                valid: false,
                error: 'File kosong tidak diizinkan'
            };
        }
        return { valid: true };
    }

    /**
     * Validate file name for security threats
     * @private
     */
    _validateFileName(fileName) {
        const result = {
            valid: true,
            warning: null,
            error: null,
            severity: 'low'
        };

        // Check for path traversal attempts
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            result.valid = false;
            result.error = 'Nama file mengandung karakter berbahaya (path traversal)';
            result.severity = 'high';
            return result;
        }

        // Check for suspicious extensions
        const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs', '.ps1'];
        const extension = '.' + fileName.toLowerCase().split('.').pop();
        if (suspiciousExtensions.includes(extension)) {
            result.valid = false;
            result.error = `Ekstensi file berbahaya: ${extension}`;
            result.severity = 'high';
            return result;
        }

        // Check for very long filenames (potential buffer overflow)
        if (fileName.length > 255) {
            result.warning = 'Nama file terlalu panjang';
            result.severity = 'medium';
        }

        return result;
    }

    /**
     * Validate file header (magic bytes)
     * @private
     */
    _validateFileHeader(file) {
        // This is a simplified validation - in production, you'd read the actual file header
        const extension = file.name.toLowerCase().split('.').pop();
        
        // Basic validation based on file type and size patterns
        if (extension === 'csv' && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
            return {
                valid: false,
                error: 'File header tidak sesuai dengan ekstensi CSV'
            };
        }

        if ((extension === 'xlsx' || extension === 'xls') && file.type && !file.type.includes('excel') && !file.type.includes('spreadsheet')) {
            return {
                valid: false,
                error: 'File header tidak sesuai dengan ekstensi Excel'
            };
        }

        return { valid: true };
    }

    /**
     * Remove malicious patterns from input
     * @private
     */
    _removeMaliciousPatterns(input) {
        let sanitized = input;
        this.maliciousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        return sanitized;
    }

    /**
     * Prevent SQL injection
     * @private
     */
    _preventSQLInjection(input) {
        let sanitized = input;
        this.sqlInjectionPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        // Escape single quotes
        sanitized = sanitized.replace(/'/g, "''");
        
        return sanitized;
    }

    /**
     * Prevent XSS attacks
     * @private
     */
    _preventXSS(input) {
        let sanitized = input;
        
        // Remove XSS patterns
        this.xssPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        // HTML encode special characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        
        return sanitized;
    }

    /**
     * Validate field-specific rules
     * @private
     */
    _validateFieldSpecific(value, fieldName) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        const rule = this.validationRules[fieldName];
        if (!rule) {
            return result;
        }

        // Required field check
        if (rule.required && (!value || value.trim() === '')) {
            result.errors.push(`${fieldName} is required`);
            result.valid = false;
            return result;
        }

        // Skip other validations if field is empty and not required
        if (!value || value.trim() === '') {
            return result;
        }

        // Length validation
        if (rule.maxLength && value.length > rule.maxLength) {
            result.errors.push(`${fieldName} exceeds maximum length of ${rule.maxLength}`);
            result.valid = false;
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            result.errors.push(`${fieldName} contains invalid characters`);
            result.valid = false;
        }

        // Allowed values validation
        if (rule.allowedValues && !rule.allowedValues.includes(value.toLowerCase())) {
            result.errors.push(`${fieldName} must be one of: ${rule.allowedValues.join(', ')}`);
            result.valid = false;
        }

        // Numeric validation
        if (rule.min !== undefined || rule.max !== undefined) {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                result.errors.push(`${fieldName} must be a valid number`);
                result.valid = false;
            } else {
                if (rule.min !== undefined && numValue < rule.min) {
                    result.errors.push(`${fieldName} must be at least ${rule.min}`);
                    result.valid = false;
                }
                if (rule.max !== undefined && numValue > rule.max) {
                    result.errors.push(`${fieldName} must not exceed ${rule.max}`);
                    result.valid = false;
                }
            }
        }

        return result;
    }

    /**
     * Validate user session
     * @private
     */
    _validateUserSession(user) {
        if (!user.id || !user.nama) {
            return {
                valid: false,
                error: 'Invalid user session - missing required fields'
            };
        }

        // Check session expiry if available
        if (user.sessionExpiry) {
            const now = new Date();
            const expiry = new Date(user.sessionExpiry);
            if (now > expiry) {
                return {
                    valid: false,
                    error: 'User session has expired'
                };
            }
        }

        return { valid: true };
    }

    /**
     * Validate user role
     * @private
     */
    _validateUserRole(user, requiredRole) {
        if (!user.role) {
            return {
                valid: false,
                error: 'User role not specified'
            };
        }

        const userRole = user.role.toLowerCase();
        const required = requiredRole.toLowerCase();

        // Admin can access everything
        if (userRole === 'admin') {
            return { valid: true };
        }

        // Check specific role requirements
        if (userRole !== required) {
            return {
                valid: false,
                error: `Insufficient privileges. Required: ${requiredRole}, Current: ${user.role}`
            };
        }

        return { valid: true };
    }

    /**
     * Validate operation permission
     * @private
     */
    _validateOperationPermission(user, operation) {
        const operationPermissions = {
            'import_config': ['admin'],
            'import_upload': ['admin', 'kasir'],
            'import_process': ['admin', 'kasir'],
            'import_report': ['admin', 'kasir']
        };

        const allowedRoles = operationPermissions[operation];
        if (!allowedRoles) {
            return {
                valid: false,
                error: `Unknown operation: ${operation}`
            };
        }

        const userRole = user.role.toLowerCase();
        if (!allowedRoles.includes(userRole)) {
            return {
                valid: false,
                error: `Operation '${operation}' not allowed for role '${user.role}'`
            };
        }

        return { valid: true };
    }

    /**
     * Perform additional security checks
     * @private
     */
    _performAdditionalSecurityChecks(user) {
        const result = {
            valid: true,
            warnings: [],
            error: null,
            critical: false
        };

        // Check for suspicious login patterns
        if (user.lastLogin) {
            const lastLogin = new Date(user.lastLogin);
            const now = new Date();
            const timeDiff = now - lastLogin;
            
            // If last login was more than 30 days ago, warn
            if (timeDiff > 30 * 24 * 60 * 60 * 1000) {
                result.warnings.push('User has not logged in for more than 30 days');
            }
        }

        // Check for account status
        if (user.status && user.status.toLowerCase() === 'suspended') {
            result.valid = false;
            result.error = 'User account is suspended';
            result.critical = true;
        }

        return result;
    }

    /**
     * Get client IP address (simplified)
     * @private
     */
    _getClientIP() {
        // In a real application, this would extract the actual client IP
        return 'unknown';
    }

    /**
     * Get user agent (simplified)
     * @private
     */
    _getUserAgent() {
        if (typeof navigator !== 'undefined') {
            return navigator.userAgent;
        }
        return 'unknown';
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.SecurityValidator = SecurityValidator;
}

// ES Module export
export { SecurityValidator };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityValidator };
}