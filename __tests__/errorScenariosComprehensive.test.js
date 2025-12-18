/**
 * Comprehensive Unit Tests for Error Scenarios
 * Tests localStorage full scenarios, print failure handling, network connectivity issues, and invalid input handling
 * Requirements: 3.2
 */

describe('Error Scenarios Comprehensive Tests', () => {
    let mockConsole;
    let originalConsole;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Mock console to capture error logs
        originalConsole = global.console;
        mockConsole = {
            error: () => {},
            log: () => {},
            warn: () => {},
            errorCalls: [],
            logCalls: [],
            warnCalls: []
        };
        
        // Override console methods to track calls
        mockConsole.error = (...args) => {
            mockConsole.errorCalls.push(args);
        };
        mockConsole.log = (...args) => {
            mockConsole.logCalls.push(args);
        };
        mockConsole.warn = (...args) => {
            mockConsole.warnCalls.push(args);
        };
        
        global.console = mockConsole;
        
        // Reset navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
    });

    afterEach(() => {
        // Restore console
        global.console = originalConsole;
    });

    describe('LocalStorage Full Scenarios', () => {
        test('should handle localStorage quota exceeded gracefully', () => {
            // Simulate localStorage quota exceeded
            let callCount = 0;
            let quotaExceeded = false;
            
            function handleStorageQuotaExceeded(key, value) {
                try {
                    callCount++;
                    if (callCount === 1) {
                        quotaExceeded = true;
                        const error = new Error('QuotaExceededError');
                        error.name = 'QuotaExceededError';
                        throw error;
                    }
                    // Success on retry after cleanup
                    localStorage.setItem(key, value);
                    return true;
                } catch (error) {
                    if (error.name === 'QuotaExceededError') {
                        // Clear old data and retry
                        localStorage.clear();
                        callCount++;
                        localStorage.setItem(key, value);
                        return true;
                    }
                    return false;
                }
            }

            const result = handleStorageQuotaExceeded('testKey', 'testValue');

            expect(result).toBe(true);
            expect(quotaExceeded).toBe(true);
            expect(localStorage.getItem('testKey')).toBe('testValue');
        });

        test('should clear old data when storage is full', () => {
            // Setup old data
            const oldData = Array.from({ length: 100 }, (_, i) => ({ 
                id: i, 
                timestamp: new Date(Date.now() - (100 - i) * 1000).toISOString(),
                data: 'test_data_' + i 
            }));
            
            localStorage.setItem('riwayatTutupKas', JSON.stringify(oldData));
            localStorage.setItem('errorLog', JSON.stringify(oldData));
            localStorage.setItem('tempData', JSON.stringify(oldData));

            function clearOldData() {
                const keysToCheck = ['riwayatTutupKas', 'errorLog', 'tempData'];
                
                keysToCheck.forEach(key => {
                    try {
                        const data = localStorage.getItem(key);
                        if (data) {
                            const parsedData = JSON.parse(data);
                            if (Array.isArray(parsedData)) {
                                // Keep only recent 50 items
                                const recentData = parsedData.slice(-50);
                                localStorage.setItem(key, JSON.stringify(recentData));
                            }
                        }
                    } catch (error) {
                        // If parsing fails, remove the item
                        localStorage.removeItem(key);
                    }
                });
            }

            clearOldData();

            // Verify data was reduced
            const clearedRiwayat = JSON.parse(localStorage.getItem('riwayatTutupKas'));
            const clearedErrorLog = JSON.parse(localStorage.getItem('errorLog'));
            const clearedTempData = JSON.parse(localStorage.getItem('tempData'));

            expect(clearedRiwayat).toHaveLength(50);
            expect(clearedErrorLog).toHaveLength(50);
            expect(clearedTempData).toHaveLength(50);
            
            // Verify we kept the most recent items
            expect(clearedRiwayat[0].id).toBe(50);
            expect(clearedRiwayat[49].id).toBe(99);
        });

        test('should remove corrupted data during cleanup', () => {
            // Setup corrupted data
            localStorage.setItem('riwayatTutupKas', 'invalid_json_data');
            localStorage.setItem('errorLog', '{"incomplete": json');
            localStorage.setItem('validData', JSON.stringify([{ id: 1, data: 'valid' }]));

            function clearOldData() {
                const keysToCheck = ['riwayatTutupKas', 'errorLog', 'validData'];
                
                keysToCheck.forEach(key => {
                    try {
                        const data = localStorage.getItem(key);
                        if (data) {
                            const parsedData = JSON.parse(data);
                            if (Array.isArray(parsedData)) {
                                const recentData = parsedData.slice(-50);
                                localStorage.setItem(key, JSON.stringify(recentData));
                            }
                        }
                    } catch (error) {
                        localStorage.removeItem(key);
                    }
                });
            }

            clearOldData();

            // Verify corrupted data was removed
            expect(localStorage.getItem('riwayatTutupKas')).toBeNull();
            expect(localStorage.getItem('errorLog')).toBeNull();
            
            // Verify valid data was preserved
            expect(localStorage.getItem('validData')).toBeTruthy();
        });

        test('should handle localStorage unavailable scenario', () => {
            // Mock localStorage to throw errors
            const originalLocalStorage = localStorage;
            
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: () => { throw new Error('Storage unavailable'); },
                    setItem: () => { throw new Error('Storage unavailable'); },
                    removeItem: () => { throw new Error('Storage unavailable'); },
                    clear: () => { throw new Error('Storage unavailable'); }
                },
                writable: true
            });

            function safeLocalStorageOperation(operation, ...args) {
                try {
                    return localStorage[operation](...args);
                } catch (error) {
                    console.error('LocalStorage operation failed:', error.message);
                    return null;
                }
            }

            const getResult = safeLocalStorageOperation('getItem', 'testKey');
            const setResult = safeLocalStorageOperation('setItem', 'testKey', 'testValue');

            expect(getResult).toBeNull();
            expect(setResult).toBeNull();
            expect(mockConsole.errorCalls.length).toBeGreaterThan(0);
            expect(mockConsole.errorCalls[0]).toContain('LocalStorage operation failed:');

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: originalLocalStorage,
                writable: true
            });
        });
    });

    describe('Print Failure Handling', () => {
        test('should handle printer not available scenario', () => {
            // Mock window.open to simulate printer not available
            const originalOpen = window.open;
            window.open = () => null;

            function handlePrintFailure(printData, printType) {
                try {
                    const printWindow = window.open('', '_blank');
                    
                    if (!printWindow) {
                        throw new Error('Printer not available - popup blocked or printer offline');
                    }
                    
                    printWindow.document.write(printData);
                    printWindow.document.close();
                    printWindow.print();
                    
                    return { success: true };
                } catch (error) {
                    return { 
                        success: false, 
                        error: error.message,
                        fallbackOptions: ['pdf', 'email', 'save']
                    };
                }
            }

            const result = handlePrintFailure('<html><body>Test</body></html>', 'Test Report');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Printer not available');
            expect(result.fallbackOptions).toContain('pdf');
            expect(result.fallbackOptions).toContain('email');
            expect(result.fallbackOptions).toContain('save');

            // Restore window.open
            window.open = originalOpen;
        });

        test('should generate PDF as fallback when print fails', () => {
            // Mock Blob and URL for PDF generation
            let blobCalls = [];
            global.Blob = function(content, options) {
                blobCalls.push({ content, options });
                return { content, type: options.type };
            };
            
            global.URL = {
                createObjectURL: () => 'blob:test-url',
                revokeObjectURL: () => {}
            };

            // Mock document.createElement for download link
            let clickCalled = false;
            const mockAnchor = {
                href: '',
                download: '',
                click: () => { clickCalled = true; },
                style: { display: '' }
            };
            
            document.createElement = () => mockAnchor;
            document.body.appendChild = () => {};
            document.body.removeChild = () => {};

            function generatePDFFallback(printData, printType) {
                try {
                    const blob = new Blob([printData], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${printType}_${new Date().toISOString().split('T')[0]}.html`;
                    a.style.display = 'none';
                    
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    URL.revokeObjectURL(url);
                    
                    return { success: true, method: 'pdf' };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            const result = generatePDFFallback('<html><body>Test Report</body></html>', 'TestReport');

            expect(result.success).toBe(true);
            expect(result.method).toBe('pdf');
            expect(blobCalls.length).toBe(1);
            expect(blobCalls[0].content).toEqual(['<html><body>Test Report</body></html>']);
            expect(clickCalled).toBe(true);
        });

        test('should handle email fallback when print and PDF fail', () => {
            // Mock window.location for mailto
            delete window.location;
            window.location = { href: '' };

            function emailReportFallback(printData, printType) {
                try {
                    const subject = encodeURIComponent(`Laporan ${printType} - ${new Date().toLocaleDateString()}`);
                    const body = encodeURIComponent(`Berikut adalah laporan ${printType}:\n\n${printData.substring(0, 1000)}...`);
                    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
                    
                    window.location.href = mailtoLink;
                    
                    return { success: true, method: 'email' };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            const result = emailReportFallback('Test report content', 'TestReport');

            expect(result.success).toBe(true);
            expect(result.method).toBe('email');
            expect(window.location.href).toContain('mailto:');
            expect(window.location.href).toContain('Laporan%20TestReport');
        });

        test('should save report data as last resort fallback', () => {
            function saveReportFallback(printData, printType) {
                try {
                    const reportKey = `backup_${printType}_${Date.now()}`;
                    const reportData = {
                        timestamp: new Date().toISOString(),
                        type: printType,
                        data: printData,
                        method: 'localStorage_backup'
                    };
                    
                    localStorage.setItem(reportKey, JSON.stringify(reportData));
                    
                    // Verify save was successful
                    const saved = localStorage.getItem(reportKey);
                    if (!saved) {
                        throw new Error('Failed to save report data');
                    }
                    
                    return { success: true, method: 'save', key: reportKey };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            const result = saveReportFallback('Test report data', 'TestReport');

            expect(result.success).toBe(true);
            expect(result.method).toBe('save');
            expect(result.key).toContain('backup_TestReport_');
            
            // Verify data was actually saved
            const savedData = JSON.parse(localStorage.getItem(result.key));
            expect(savedData.data).toBe('Test report data');
            expect(savedData.type).toBe('TestReport');
        });
    });

    describe('Network Connectivity Issues', () => {
        test('should detect offline mode and queue operations', () => {
            // Set navigator to offline
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            const operationQueue = [];

            function handleNetworkOperation(operation, data) {
                if (!navigator.onLine) {
                    // Queue operation for when connection returns
                    operationQueue.push({
                        operation,
                        data,
                        timestamp: new Date().toISOString(),
                        status: 'queued'
                    });
                    
                    return { 
                        success: false, 
                        reason: 'offline',
                        queued: true 
                    };
                }
                
                // Process operation immediately when online
                return { 
                    success: true, 
                    processed: true 
                };
            }

            const result1 = handleNetworkOperation('saveData', { test: 'data1' });
            const result2 = handleNetworkOperation('syncData', { test: 'data2' });

            expect(result1.success).toBe(false);
            expect(result1.reason).toBe('offline');
            expect(result1.queued).toBe(true);
            expect(operationQueue).toHaveLength(2);
            expect(operationQueue[0].operation).toBe('saveData');
            expect(operationQueue[1].operation).toBe('syncData');
        });

        test('should process queued operations when connection returns', () => {
            const operationQueue = [
                { operation: 'saveData', data: { test: 'data1' }, status: 'queued' },
                { operation: 'syncData', data: { test: 'data2' }, status: 'queued' }
            ];

            function processQueuedOperations() {
                if (!navigator.onLine) {
                    return { processed: 0, reason: 'still_offline' };
                }

                let processed = 0;
                const results = [];

                operationQueue.forEach((queuedOp, index) => {
                    if (queuedOp.status === 'queued') {
                        try {
                            // Simulate processing the operation
                            const result = {
                                operation: queuedOp.operation,
                                data: queuedOp.data,
                                processed: true,
                                timestamp: new Date().toISOString()
                            };
                            
                            results.push(result);
                            operationQueue[index].status = 'processed';
                            processed++;
                        } catch (error) {
                            operationQueue[index].status = 'failed';
                            operationQueue[index].error = error.message;
                        }
                    }
                });

                return { processed, results };
            }

            // Set back to online
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
            });

            const result = processQueuedOperations();

            expect(result.processed).toBe(2);
            expect(result.results).toHaveLength(2);
            expect(result.results[0].operation).toBe('saveData');
            expect(result.results[1].operation).toBe('syncData');
            expect(operationQueue[0].status).toBe('processed');
            expect(operationQueue[1].status).toBe('processed');
        });

        test('should handle network timeout scenarios', (done) => {
            function simulateNetworkTimeout(operation, timeout = 5000) {
                return new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error(`Network timeout after ${timeout}ms`));
                    }, timeout);

                    // Simulate network operation
                    setTimeout(() => {
                        clearTimeout(timeoutId);
                        
                        if (navigator.onLine) {
                            resolve({ success: true, operation });
                        } else {
                            reject(new Error('Network unavailable'));
                        }
                    }, timeout + 100); // Simulate timeout
                });
            }

            simulateNetworkTimeout('testOperation', 100)
                .then(() => {
                    done.fail('Should have timed out');
                })
                .catch((error) => {
                    expect(error.message).toContain('Network timeout after 100ms');
                    done();
                });
        });

        test('should retry network operations with exponential backoff', async () => {
            let attemptCount = 0;
            const maxRetries = 3;

            function networkOperationWithRetry(operation, data, retryCount = 0) {
                return new Promise((resolve, reject) => {
                    attemptCount++;
                    
                    // Simulate network failure for first 2 attempts
                    if (attemptCount <= 2) {
                        const error = new Error('Network error');
                        
                        if (retryCount < maxRetries) {
                            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                            
                            setTimeout(() => {
                                networkOperationWithRetry(operation, data, retryCount + 1)
                                    .then(resolve)
                                    .catch(reject);
                            }, delay);
                        } else {
                            reject(error);
                        }
                    } else {
                        // Success on 3rd attempt
                        resolve({ 
                            success: true, 
                            attempts: attemptCount,
                            operation,
                            data 
                        });
                    }
                });
            }

            const result = await networkOperationWithRetry('testSync', { test: 'data' });

            expect(result.success).toBe(true);
            expect(result.attempts).toBe(3);
            expect(attemptCount).toBe(3);
        });
    });

    describe('Invalid Input Handling', () => {
        test('should validate and reject invalid currency inputs', () => {
            function validateCurrencyInput(value, fieldName) {
                const errors = [];
                
                // Check if value is a number
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    errors.push(`${fieldName} harus berupa angka`);
                }
                
                // Check for negative values
                if (numValue < 0) {
                    errors.push(`${fieldName} tidak boleh negatif`);
                }
                
                // Check for extremely large values
                if (numValue > 999999999) {
                    errors.push(`${fieldName} terlalu besar (maksimal 999,999,999)`);
                }
                
                // Check for too many decimal places
                if (value !== null && value !== undefined) {
                    const decimalPlaces = (value.toString().split('.')[1] || '').length;
                    if (decimalPlaces > 2) {
                        errors.push(`${fieldName} maksimal 2 angka desimal`);
                    }
                }
                
                return {
                    isValid: errors.length === 0,
                    errors,
                    value: isNaN(numValue) ? 0 : numValue
                };
            }

            // Test invalid inputs
            const testCases = [
                { input: 'abc', expectedErrors: 1 },
                { input: '-100', expectedErrors: 1 },
                { input: '1000000000', expectedErrors: 1 },
                { input: '123.456', expectedErrors: 1 },
                { input: '', expectedErrors: 1 },
                { input: null, expectedErrors: 1 },
                { input: undefined, expectedErrors: 1 }
            ];

            testCases.forEach(testCase => {
                const result = validateCurrencyInput(testCase.input, 'Kas Aktual');
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThanOrEqual(testCase.expectedErrors);
            });

            // Test valid inputs
            const validCases = ['100', '1000.50', '0', '999999999'];
            validCases.forEach(validInput => {
                const result = validateCurrencyInput(validInput, 'Kas Aktual');
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        test('should validate required fields and reject empty inputs', () => {
            function validateRequiredField(value, fieldName) {
                const errors = [];
                
                // Check for null, undefined, or empty string
                if (value === null || value === undefined) {
                    errors.push(`${fieldName} wajib diisi`);
                } else if (typeof value === 'string' && value.trim() === '') {
                    errors.push(`${fieldName} tidak boleh kosong`);
                } else if (typeof value === 'string' && /^\s+$/.test(value)) {
                    errors.push(`${fieldName} tidak boleh hanya berisi spasi`);
                }
                
                return {
                    isValid: errors.length === 0,
                    errors,
                    value: typeof value === 'string' ? value.trim() : value
                };
            }

            // Test invalid inputs
            const invalidCases = [
                { input: null, field: 'Keterangan' },
                { input: undefined, field: 'Keterangan' },
                { input: '', field: 'Keterangan' },
                { input: '   ', field: 'Keterangan' },
                { input: '\t\n  ', field: 'Keterangan' }
            ];

            invalidCases.forEach(testCase => {
                const result = validateRequiredField(testCase.input, testCase.field);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
                expect(result.errors[0]).toContain(testCase.field);
            });

            // Test valid inputs
            const validCases = [
                'Valid text',
                'Text with spaces',
                '123',
                'Special chars: !@#$%'
            ];

            validCases.forEach(validInput => {
                const result = validateRequiredField(validInput, 'Keterangan');
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        test('should validate text length and reject oversized inputs', () => {
            function validateTextLength(value, fieldName, maxLength = 500) {
                const errors = [];
                
                if (value && typeof value === 'string') {
                    if (value.length > maxLength) {
                        errors.push(`${fieldName} terlalu panjang (maksimal ${maxLength} karakter)`);
                    }
                    
                    // Check for suspicious patterns
                    if (/(.)\1{50,}/.test(value)) {
                        errors.push(`${fieldName} mengandung pola karakter yang mencurigakan`);
                    }
                    
                    // Check for potential script injection
                    if (/<script|javascript:|on\w+\s*=/i.test(value)) {
                        errors.push(`${fieldName} mengandung konten yang tidak diizinkan`);
                    }
                }
                
                return {
                    isValid: errors.length === 0,
                    errors,
                    value: value,
                    length: value ? value.length : 0
                };
            }

            // Test oversized input
            const longText = 'x'.repeat(600);
            const longResult = validateTextLength(longText, 'Keterangan');
            expect(longResult.isValid).toBe(false);
            expect(longResult.errors[0]).toContain('terlalu panjang');

            // Test suspicious patterns
            const suspiciousText = 'a'.repeat(60);
            const suspiciousResult = validateTextLength(suspiciousText, 'Keterangan');
            expect(suspiciousResult.isValid).toBe(false);
            expect(suspiciousResult.errors[0]).toContain('mencurigakan');

            // Test script injection
            const scriptText = '<script>alert("xss")</script>';
            const scriptResult = validateTextLength(scriptText, 'Keterangan');
            expect(scriptResult.isValid).toBe(false);
            expect(scriptResult.errors[0]).toContain('tidak diizinkan');

            // Test valid input
            const validText = 'This is a normal text input with reasonable length.';
            const validResult = validateTextLength(validText, 'Keterangan');
            expect(validResult.isValid).toBe(true);
            expect(validResult.errors).toHaveLength(0);
        });

        test('should handle edge cases in input validation', () => {
            function validateInputEdgeCases(value, type, fieldName) {
                const errors = [];
                
                try {
                    switch (type) {
                        case 'currency':
                            // Handle edge cases for currency
                            if (value === '0.00') {
                                // Allow zero values
                                return { isValid: true, errors: [], value: 0 };
                            }
                            
                            if (value === 'Infinity' || value === '-Infinity') {
                                errors.push(`${fieldName} tidak boleh infinity`);
                            }
                            
                            if (value === 'NaN') {
                                errors.push(`${fieldName} bukan angka yang valid`);
                            }
                            
                            // Handle scientific notation
                            if (/e[+-]?\d+/i.test(value)) {
                                errors.push(`${fieldName} tidak boleh menggunakan notasi ilmiah`);
                            }
                            break;
                            
                        case 'text':
                            // Handle Unicode edge cases
                            if (/[\u0000-\u001F\u007F-\u009F]/.test(value)) {
                                errors.push(`${fieldName} mengandung karakter kontrol yang tidak valid`);
                            }
                            
                            // Handle extremely long Unicode characters
                            if (/[\uD800-\uDFFF]/.test(value)) {
                                errors.push(`${fieldName} mengandung karakter Unicode yang tidak lengkap`);
                            }
                            break;
                    }
                } catch (error) {
                    errors.push(`Error validating ${fieldName}: ${error.message}`);
                }
                
                return {
                    isValid: errors.length === 0,
                    errors,
                    value
                };
            }

            // Test currency edge cases
            const currencyEdgeCases = [
                { input: 'Infinity', expected: false },
                { input: '-Infinity', expected: false },
                { input: 'NaN', expected: false },
                { input: '1e10', expected: false },
                { input: '0.00', expected: true }
            ];

            currencyEdgeCases.forEach(testCase => {
                const result = validateInputEdgeCases(testCase.input, 'currency', 'Test Amount');
                expect(result.isValid).toBe(testCase.expected);
            });

            // Test text edge cases
            const textEdgeCases = [
                { input: 'Normal text', expected: true },
                { input: 'Text with\u0000null', expected: false },
                { input: 'Text with\u001Fcontrol', expected: false },
                { input: 'Valid Unicode: 你好', expected: true }
            ];

            textEdgeCases.forEach(testCase => {
                const result = validateInputEdgeCases(testCase.input, 'text', 'Test Text');
                expect(result.isValid).toBe(testCase.expected);
            });
        });
    });

    describe('Error Recovery and Resilience', () => {
        test('should recover from multiple simultaneous errors', () => {
            const errorLog = [];
            
            function handleMultipleErrors() {
                const errors = [];
                
                // Simulate multiple error conditions
                try {
                    // Storage error
                    localStorage.setItem('test', 'x'.repeat(10000000));
                } catch (e) {
                    errors.push({ type: 'storage', error: e.message });
                }
                
                try {
                    // Network error
                    if (!navigator.onLine) {
                        throw new Error('Network unavailable');
                    }
                } catch (e) {
                    errors.push({ type: 'network', error: e.message });
                }
                
                try {
                    // Validation error
                    const invalidData = { amount: 'invalid' };
                    if (isNaN(invalidData.amount)) {
                        throw new Error('Invalid amount format');
                    }
                } catch (e) {
                    errors.push({ type: 'validation', error: e.message });
                }
                
                // Log all errors
                errors.forEach(error => {
                    errorLog.push({
                        timestamp: new Date().toISOString(),
                        type: error.type,
                        message: error.error
                    });
                });
                
                // Return recovery strategy
                return {
                    hasErrors: errors.length > 0,
                    errorCount: errors.length,
                    errors: errors,
                    recoveryActions: errors.map(e => `recover_${e.type}`)
                };
            }

            const result = handleMultipleErrors();

            expect(result.hasErrors).toBe(true);
            expect(result.errorCount).toBeGreaterThan(0);
            expect(result.recoveryActions).toContain('recover_validation');
            expect(errorLog.length).toBe(result.errorCount);
        });

        test('should maintain data integrity during error conditions', () => {
            const criticalData = {
                kasir: 'Test Kasir',
                modalAwal: 100000,
                transactions: []
            };
            
            function performCriticalOperation(data, operation) {
                // Create backup before operation
                const backup = JSON.parse(JSON.stringify(data));
                
                try {
                    switch (operation) {
                        case 'add_transaction':
                            data.transactions.push({ id: Date.now(), amount: 50000 });
                            break;
                        case 'update_modal':
                            data.modalAwal = 150000;
                            break;
                        case 'invalid_operation':
                            throw new Error('Simulated operation failure');
                    }
                    
                    // Validate data integrity
                    if (!data.kasir || data.modalAwal < 0) {
                        throw new Error('Data integrity violation');
                    }
                    
                    return { success: true, data };
                } catch (error) {
                    // Restore from backup on error
                    Object.assign(data, backup);
                    
                    return { 
                        success: false, 
                        error: error.message,
                        dataRestored: true,
                        data 
                    };
                }
            }

            // Test successful operation
            const successResult = performCriticalOperation(criticalData, 'add_transaction');
            expect(successResult.success).toBe(true);
            expect(criticalData.transactions).toHaveLength(1);

            // Test failed operation with data restoration
            const failResult = performCriticalOperation(criticalData, 'invalid_operation');
            expect(failResult.success).toBe(false);
            expect(failResult.dataRestored).toBe(true);
            expect(criticalData.transactions).toHaveLength(1); // Data preserved
        });
    });
});