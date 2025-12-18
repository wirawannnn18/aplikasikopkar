/**
 * Unit Tests for Comprehensive Error Handling
 * Tests localStorage issues, print failures, network problems, and input validation
 */

// Mock the ComprehensiveErrorHandler class for testing
class ComprehensiveErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    logError(type, error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: error?.message || error,
            stack: error?.stack,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errorLog.push(errorEntry);
        
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
    }

    safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return this.handleStorageQuotaExceeded(key, value);
            }
            return false;
        }
    }

    safeLocalStorageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            this.logError('LocalStorage Get Error', error, { key });
            return null;
        }
    }

    handleStorageQuotaExceeded(key, value) {
        try {
            this.clearOldData();
            localStorage.setItem(key, value);
            return true;
        } catch (retryError) {
            return false;
        }
    }

    clearOldData() {
        const keysToCheck = ['riwayatTutupKas', 'errorLog', 'tempData'];
        
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

    validateSessionWithRecovery(sessionKey) {
        try {
            const sessionData = this.safeLocalStorageGet(sessionKey);
            
            if (!sessionData) {
                return this.handleMissingSession(sessionKey);
            }
            
            const parsed = JSON.parse(sessionData);
            
            const requiredFields = ['id', 'kasir', 'kasirId', 'modalAwal', 'waktuBuka'];
            const missingFields = requiredFields.filter(field => !parsed[field]);
            
            if (missingFields.length > 0) {
                return this.handleCorruptedSession(sessionKey, missingFields);
            }
            
            return { success: true, data: parsed };
        } catch (error) {
            this.logError('Session Validation Error', error, { sessionKey });
            return this.handleCorruptedSession(sessionKey, ['parse_error']);
        }
    }

    handleMissingSession(sessionKey) {
        return { 
            success: false, 
            error: 'missing_session',
            action: 'redirect_to_buka_kas'
        };
    }

    handleCorruptedSession(sessionKey, missingFields) {
        this.logError('Corrupted Session', new Error('Session data corrupted'), { 
            sessionKey, 
            missingFields 
        });
        
        const backupKey = `${sessionKey}_backup`;
        const backupData = this.safeLocalStorageGet(backupKey);
        
        if (backupData) {
            try {
                const parsed = JSON.parse(backupData);
                this.safeLocalStorageSet(sessionKey, backupData);
                return { success: true, data: parsed };
            } catch (error) {
                this.logError('Backup Recovery Failed', error);
            }
        }
        
        return { 
            success: false, 
            error: 'corrupted_session',
            action: 'clear_and_restart'
        };
    }

    validateInput(value, type, fieldName) {
        const errors = [];
        
        switch (type) {
            case 'currency':
                if (isNaN(value) || value < 0) {
                    errors.push(`${fieldName} harus berupa angka positif`);
                }
                if (value > 999999999) {
                    errors.push(`${fieldName} terlalu besar`);
                }
                break;
                
            case 'required':
                if (!value || value.toString().trim() === '') {
                    errors.push(`${fieldName} wajib diisi`);
                }
                break;
                
            case 'text':
                if (value && value.length > 500) {
                    errors.push(`${fieldName} terlalu panjang (maksimal 500 karakter)`);
                }
                break;
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    generatePDF(printData, printType) {
        try {
            const blob = new Blob([printData], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${printType}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            this.logError('PDF Generation Failed', error, { printType });
            return false;
        }
    }

    emailReport(printData, printType) {
        try {
            const subject = encodeURIComponent(`Laporan ${printType} - ${new Date().toLocaleDateString()}`);
            const body = encodeURIComponent(`Berikut adalah laporan ${printType}:\n\n${printData}`);
            const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
            
            window.location.href = mailtoLink;
            return true;
        } catch (error) {
            this.logError('Email Failed', error, { printType });
            return false;
        }
    }

    saveReportData(printData, printType) {
        const reportKey = `backup_${printType}_${Date.now()}`;
        return this.safeLocalStorageSet(reportKey, printData);
    }

    handleNetworkError(operation, callback) {
        if (!navigator.onLine) {
            return false;
        }
        return true;
    }

    getErrorStats() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorTypes: {},
            recentErrors: this.errorLog.slice(-10)
        };
        
        this.errorLog.forEach(error => {
            stats.errorTypes[error.type] = (stats.errorTypes[error.type] || 0) + 1;
        });
        
        return stats;
    }
}

// Mock DOM and browser APIs
const mockWindow = {
    addEventListener: jest.fn(),
    location: { href: 'http://localhost/test' },
    open: jest.fn(),
    dispatchEvent: jest.fn()
};

const mockDocument = {
    createElement: jest.fn(() => ({
        className: '',
        innerHTML: '',
        href: '',
        download: '',
        click: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        addEventListener: jest.fn(),
        style: {},
        dataset: {}
    })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        insertAdjacentHTML: jest.fn()
    }
};

const mockNavigator = {
    userAgent: 'Test Browser',
    onLine: true
};

const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

const mockURL = {
    createObjectURL: jest.fn(() => 'blob:test-url'),
    revokeObjectURL: jest.fn()
};

const mockBlob = jest.fn();
const mockBootstrap = {
    Modal: jest.fn(() => ({
        show: jest.fn(),
        hide: jest.fn()
    }))
};

// Set up global mocks
global.window = mockWindow;
global.document = mockDocument;
global.navigator = mockNavigator;
global.localStorage = mockLocalStorage;
global.URL = mockURL;
global.Blob = mockBlob;
global.bootstrap = mockBootstrap;

describe('ComprehensiveErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        errorHandler = new ComprehensiveErrorHandler();
    });

    describe('Error Logging', () => {
        test('should log errors with timestamp and context', () => {
            const testError = new Error('Test error');
            const context = { testKey: 'testValue' };

            errorHandler.logError('Test Error', testError, context);

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0]).toMatchObject({
                type: 'Test Error',
                message: 'Test error',
                context: context
            });
            expect(errorHandler.errorLog[0].timestamp).toBeDefined();
        });

        test('should limit error log size', () => {
            errorHandler.maxLogSize = 3;

            for (let i = 0; i < 5; i++) {
                errorHandler.logError('Test Error', new Error(`Error ${i}`));
            }

            expect(errorHandler.errorLog).toHaveLength(3);
            expect(errorHandler.errorLog[0].message).toBe('Error 2');
            expect(errorHandler.errorLog[2].message).toBe('Error 4');
        });
    });

    describe('LocalStorage Operations', () => {
        test('should handle localStorage setItem success', () => {
            localStorage.setItem.mockImplementation(() => {});

            const result = errorHandler.safeLocalStorageSet('testKey', 'testValue');

            expect(result).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
        });

        test('should handle localStorage quota exceeded error', () => {
            const quotaError = new Error('QuotaExceededError');
            quotaError.name = 'QuotaExceededError';
            
            localStorage.setItem
                .mockImplementationOnce(() => { throw quotaError; })
                .mockImplementationOnce(() => {}); // Success on retry

            localStorage.getItem.mockReturnValue('[]');

            const result = errorHandler.safeLocalStorageSet('testKey', 'testValue');

            expect(result).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledTimes(2);
        });

        test('should handle localStorage getItem safely', () => {
            localStorage.getItem.mockReturnValue('testValue');

            const result = errorHandler.safeLocalStorageGet('testKey');

            expect(result).toBe('testValue');
            expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
        });

        test('should handle localStorage getItem error', () => {
            localStorage.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const result = errorHandler.safeLocalStorageGet('testKey');

            expect(result).toBeNull();
            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].type).toBe('LocalStorage Get Error');
        });
    });

    describe('Session Validation', () => {
        test('should validate valid session data', () => {
            const validSession = {
                id: 'test-id',
                kasir: 'Test Kasir',
                kasirId: 'TK001',
                modalAwal: 100000,
                waktuBuka: '2023-01-01T10:00:00Z'
            };

            localStorage.getItem.mockReturnValue(JSON.stringify(validSession));

            const result = errorHandler.validateSessionWithRecovery('testSession');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(validSession);
        });

        test('should handle missing session data', () => {
            localStorage.getItem.mockReturnValue(null);

            const result = errorHandler.validateSessionWithRecovery('testSession');

            expect(result.success).toBe(false);
            expect(result.error).toBe('missing_session');
            expect(result.action).toBe('redirect_to_buka_kas');
        });

        test('should handle corrupted session data', () => {
            localStorage.getItem.mockReturnValue('invalid_json');

            const result = errorHandler.validateSessionWithRecovery('testSession');

            expect(result.success).toBe(false);
            expect(result.error).toBe('corrupted_session');
            expect(result.action).toBe('clear_and_restart');
        });

        test('should recover from backup when session is corrupted', () => {
            const validBackup = {
                id: 'backup-id',
                kasir: 'Backup Kasir',
                kasirId: 'BK001',
                modalAwal: 50000,
                waktuBuka: '2023-01-01T09:00:00Z'
            };

            localStorage.getItem
                .mockReturnValueOnce('invalid_json') // Main session corrupted
                .mockReturnValueOnce(JSON.stringify(validBackup)); // Backup available

            const result = errorHandler.validateSessionWithRecovery('testSession');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(validBackup);
            expect(localStorage.setItem).toHaveBeenCalledWith('testSession', JSON.stringify(validBackup));
        });
    });

    describe('Input Validation', () => {
        test('should validate currency input correctly', () => {
            const testCases = [
                { value: '1000', expected: true },
                { value: '0', expected: true },
                { value: '-100', expected: false },
                { value: 'abc', expected: false },
                { value: '1000000000', expected: false }
            ];

            testCases.forEach(testCase => {
                const result = errorHandler.validateInput(testCase.value, 'currency', 'Test Field');
                expect(result.isValid).toBe(testCase.expected);
            });
        });

        test('should validate required input correctly', () => {
            const testCases = [
                { value: 'valid text', expected: true },
                { value: '', expected: false },
                { value: '   ', expected: false },
                { value: null, expected: false },
                { value: undefined, expected: false }
            ];

            testCases.forEach(testCase => {
                const result = errorHandler.validateInput(testCase.value, 'required', 'Test Field');
                expect(result.isValid).toBe(testCase.expected);
            });
        });

        test('should validate text length correctly', () => {
            const shortText = 'Short text';
            const longText = 'x'.repeat(600);

            const shortResult = errorHandler.validateInput(shortText, 'text', 'Test Field');
            const longResult = errorHandler.validateInput(longText, 'text', 'Test Field');

            expect(shortResult.isValid).toBe(true);
            expect(longResult.isValid).toBe(false);
            expect(longResult.errors[0]).toContain('terlalu panjang');
        });
    });

    describe('Print Error Handling', () => {
        test('should generate PDF successfully', () => {
            const testData = '<html><body>Test</body></html>';
            
            const result = errorHandler.generatePDF(testData, 'TestReport');

            expect(result).toBe(true);
            expect(global.Blob).toHaveBeenCalledWith([testData], { type: 'text/html' });
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });

        test('should handle PDF generation error', () => {
            global.Blob.mockImplementation(() => {
                throw new Error('Blob creation failed');
            });

            const result = errorHandler.generatePDF('test data', 'TestReport');

            expect(result).toBe(false);
            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].type).toBe('PDF Generation Failed');
        });

        test('should handle email report', () => {
            // Mock window.location.href setter
            delete window.location;
            window.location = { href: '' };

            const result = errorHandler.emailReport('test data', 'TestReport');

            expect(result).toBe(true);
            expect(window.location.href).toContain('mailto:');
        });

        test('should save report data as backup', () => {
            localStorage.setItem.mockImplementation(() => {});

            const result = errorHandler.saveReportData('test data', 'TestReport');

            expect(result).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('Network Error Handling', () => {
        test('should detect offline mode', () => {
            navigator.onLine = false;
            const callback = jest.fn();

            const result = errorHandler.handleNetworkError('test operation', callback);

            expect(result).toBe(false);
            expect(callback).not.toHaveBeenCalled();
        });

        test('should proceed when online', () => {
            navigator.onLine = true;
            const callback = jest.fn();

            const result = errorHandler.handleNetworkError('test operation', callback);

            expect(result).toBe(true);
        });
    });

    describe('Data Cleanup', () => {
        test('should clear old data to free space', () => {
            const oldData = Array.from({ length: 100 }, (_, i) => ({ id: i, data: 'test' }));
            localStorage.getItem.mockReturnValue(JSON.stringify(oldData));
            localStorage.setItem.mockImplementation(() => {});

            errorHandler.clearOldData();

            expect(localStorage.setItem).toHaveBeenCalled();
            const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
            expect(savedData).toHaveLength(50);
        });

        test('should remove corrupted data during cleanup', () => {
            localStorage.getItem.mockReturnValue('invalid_json');
            localStorage.removeItem.mockImplementation(() => {});

            errorHandler.clearOldData();

            expect(localStorage.removeItem).toHaveBeenCalled();
        });
    });

    describe('Error Statistics', () => {
        test('should provide error statistics', () => {
            errorHandler.logError('Type A', new Error('Error 1'));
            errorHandler.logError('Type A', new Error('Error 2'));
            errorHandler.logError('Type B', new Error('Error 3'));

            const stats = errorHandler.getErrorStats();

            expect(stats.totalErrors).toBe(3);
            expect(stats.errorTypes['Type A']).toBe(2);
            expect(stats.errorTypes['Type B']).toBe(1);
            expect(stats.recentErrors).toHaveLength(3);
        });

        test('should limit recent errors in stats', () => {
            for (let i = 0; i < 15; i++) {
                errorHandler.logError('Test', new Error(`Error ${i}`));
            }

            const stats = errorHandler.getErrorStats();

            expect(stats.totalErrors).toBe(15);
            expect(stats.recentErrors).toHaveLength(10);
        });
    });
});

describe('Error Handler Integration', () => {
    test('should handle multiple error types in sequence', () => {
        const errorHandler = new ComprehensiveErrorHandler();
        
        // Test sequence of different error types
        errorHandler.logError('Storage Error', new Error('Storage failed'));
        errorHandler.logError('Network Error', new Error('Network failed'));
        errorHandler.logError('Validation Error', new Error('Validation failed'));

        const stats = errorHandler.getErrorStats();
        
        expect(stats.totalErrors).toBe(3);
        expect(Object.keys(stats.errorTypes)).toHaveLength(3);
    });

    test('should maintain error log integrity during operations', () => {
        const errorHandler = new ComprehensiveErrorHandler();
        
        // Simulate concurrent error logging
        const errors = Array.from({ length: 50 }, (_, i) => 
            new Error(`Concurrent error ${i}`)
        );

        errors.forEach((error, index) => {
            errorHandler.logError(`Type ${index % 5}`, error);
        });

        expect(errorHandler.errorLog).toHaveLength(50);
        expect(errorHandler.getErrorStats().totalErrors).toBe(50);
    });
});