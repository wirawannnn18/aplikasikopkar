/**
 * Audit Logger Tests
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import fc from 'fast-check';

// Import the class to test
let AuditLogger;

beforeAll(async () => {
    // Dynamic import to handle ES modules
    const module = await import('../../js/import-tagihan/AuditLogger.js');
    AuditLogger = module.AuditLogger;
});

describe('AuditLogger', () => {
    let auditLogger;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        auditLogger = new AuditLogger();
    });

    describe('Constructor', () => {
        test('should initialize with default settings', () => {
            expect(auditLogger.logStorage).toBe('import_tagihan_audit_logs');
            expect(auditLogger.maxLogEntries).toBe(10000);
            expect(auditLogger.logLevel).toBe('INFO');
            expect(auditLogger.sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
        });

        test('should initialize storage', () => {
            // Check that storage was initialized by verifying the logs array exists
            const logs = auditLogger.getLogs();
            expect(Array.isArray(logs)).toBe(true);
            expect(logs).toHaveLength(0);
        });
    });

    describe('File Upload Logging', () => {
        test('logFileUpload should create proper log entry', () => {
            const uploadData = {
                fileName: 'test.csv',
                fileSize: 1024,
                fileType: 'text/csv',
                userId: 'user123',
                userName: 'Test User',
                batchId: 'batch123',
                metadata: { source: 'manual' }
            };

            auditLogger.logFileUpload(uploadData);

            const logs = auditLogger.getLogs();
            expect(logs).toHaveLength(1);
            
            const log = logs[0];
            expect(log.action).toBe('FILE_UPLOAD');
            expect(log.category).toBe('UPLOAD');
            expect(log.userId).toBe('user123');
            expect(log.userName).toBe('Test User');
            expect(log.batchId).toBe('batch123');
            expect(log.details.fileName).toBe('test.csv');
            expect(log.details.fileSize).toBe(1024);
            expect(log.details.fileType).toBe('text/csv');
            expect(log.details.fileSizeFormatted).toBe('1 KB');
            expect(log.level).toBe('INFO');
        });
    });

    describe('Validation Results Logging', () => {
        test('logValidationResults should create proper log entry', () => {
            const validationData = {
                batchId: 'batch123',
                totalRows: 100,
                validRows: 90,
                invalidRows: 10,
                errorSummary: ['Invalid member', 'Invalid amount'],
                userId: 'user123',
                userName: 'Test User',
                processingTimeMs: 1500
            };

            auditLogger.logValidationResults(validationData);

            const logs = auditLogger.getLogs();
            expect(logs).toHaveLength(1);
            
            const log = logs[0];
            expect(log.action).toBe('VALIDATION_COMPLETED');
            expect(log.category).toBe('VALIDATION');
            expect(log.batchId).toBe('batch123');
            expect(log.details.totalRows).toBe(100);
            expect(log.details.validRows).toBe(90);
            expect(log.details.invalidRows).toBe(10);
            expect(log.details.validPercentage).toBe('90.00');
            expect(log.level).toBe('WARN'); // Because invalidRows > 0
        });
    });

    /**
     * Property 8: Audit logging completeness
     * Feature: import-tagihan-pembayaran, Property 8: Audit logging completeness
     * Validates: Requirements 7.1, 7.2
     */
    describe('Property 8: Audit logging completeness', () => {
        test('Property 8: All audit operations should create complete log entries with required metadata', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        fileName: fc.string({ minLength: 1, maxLength: 50 }),
                        fileSize: fc.integer({ min: 1, max: 5000000 }),
                        userId: fc.string({ minLength: 1, maxLength: 20 }),
                        userName: fc.string({ minLength: 1, maxLength: 50 }),
                        batchId: fc.string({ minLength: 1, maxLength: 20 }),
                        totalRows: fc.integer({ min: 1, max: 1000 }),
                        validRows: fc.integer({ min: 0, max: 1000 })
                    }),
                    (testData) => {
                        // Ensure validRows doesn't exceed totalRows
                        const validRows = Math.min(testData.validRows, testData.totalRows);
                        const invalidRows = testData.totalRows - validRows;

                        // Clear logs before test
                        localStorage.clear();
                        const logger = new AuditLogger();

                        // Test file upload logging (Requirements 7.1)
                        logger.logFileUpload({
                            fileName: testData.fileName,
                            fileSize: testData.fileSize,
                            fileType: 'text/csv',
                            userId: testData.userId,
                            userName: testData.userName,
                            batchId: testData.batchId
                        });

                        // Test validation results logging (Requirements 7.2)
                        logger.logValidationResults({
                            batchId: testData.batchId,
                            totalRows: testData.totalRows,
                            validRows: validRows,
                            invalidRows: invalidRows,
                            errorSummary: ['Test error'],
                            userId: testData.userId,
                            userName: testData.userName,
                            processingTimeMs: 1000
                        });

                        // Verify all logs were created
                        const logs = logger.getLogs();
                        const expectedLogCount = 2; // upload + validation
                        
                        // All operations should create log entries
                        const allLogsCreated = logs.length === expectedLogCount;

                        // All logs should have required metadata (Requirements 7.1, 7.2)
                        const allLogsHaveMetadata = logs.every(log => 
                            log.id && 
                            log.action && 
                            log.category && 
                            log.userId && 
                            log.userName && 
                            log.timestamp && 
                            log.sessionId && 
                            log.level &&
                            log.details !== undefined
                        );

                        // File upload logs should have complete file metadata (Requirements 7.1)
                        const uploadLogs = logs.filter(log => log.action === 'FILE_UPLOAD');
                        const uploadLogsComplete = uploadLogs.every(log =>
                            log.details.fileName === testData.fileName &&
                            log.details.fileSize === testData.fileSize &&
                            log.details.fileType === 'text/csv' &&
                            log.details.fileSizeFormatted &&
                            log.batchId === testData.batchId
                        );

                        // Validation logs should have complete validation metadata (Requirements 7.2)
                        const validationLogs = logs.filter(log => log.action === 'VALIDATION_COMPLETED');
                        const validationLogsComplete = validationLogs.every(log =>
                            log.details.totalRows === testData.totalRows &&
                            log.details.validRows === validRows &&
                            log.details.invalidRows === invalidRows &&
                            log.details.validPercentage &&
                            log.details.errorSummary &&
                            log.batchId === testData.batchId
                        );

                        return allLogsCreated && 
                               allLogsHaveMetadata && 
                               uploadLogsComplete && 
                               validationLogsComplete;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Method Signatures', () => {
        test('should have all required methods', () => {
            expect(typeof auditLogger.logFileUpload).toBe('function');
            expect(typeof auditLogger.logValidationResults).toBe('function');
            expect(typeof auditLogger.logBatchTransaction).toBe('function');
            expect(typeof auditLogger.logBatchCompletion).toBe('function');
            expect(typeof auditLogger.logSystemError).toBe('function');
            expect(typeof auditLogger.getLogs).toBe('function');
            expect(typeof auditLogger.getAuditStatistics).toBe('function');
            expect(typeof auditLogger.cleanupOldLogs).toBe('function');
        });
    });
});