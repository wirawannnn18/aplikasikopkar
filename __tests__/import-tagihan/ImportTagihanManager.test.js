/**
 * Import Tagihan Manager Tests
 * Requirements: 1.1, 2.1, 3.1
 */

import fc from 'fast-check';
import { jest } from '@jest/globals';

// Mock implementations for testing - will be properly mocked in beforeEach
let mockPaymentEngine;
let mockAuditLogger;

// Import the class to test
let ImportTagihanManager;

beforeAll(async () => {
    // Dynamic import to handle ES modules
    const module = await import('../../js/import-tagihan/ImportTagihanManager.js');
    ImportTagihanManager = module.ImportTagihanManager;
});

describe('ImportTagihanManager', () => {
    let manager;

    beforeEach(() => {
        // Create fresh mock objects for each test
        mockPaymentEngine = {
            processPayment: jest.fn(),
            rollbackPayment: jest.fn()
        };

        mockAuditLogger = {
            log: jest.fn()
        };

        manager = new ImportTagihanManager(mockPaymentEngine, mockAuditLogger);
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with payment engine and audit logger', () => {
            expect(manager.paymentEngine).toBe(mockPaymentEngine);
            expect(manager.auditLogger).toBe(mockAuditLogger);
            expect(manager.currentBatch).toBeNull();
            expect(manager.isProcessing).toBe(false);
            expect(manager.isCancelled).toBe(false);
        });
    });

    describe('Method Signatures', () => {
        test('should have all required methods', () => {
            expect(typeof manager.uploadFile).toBe('function');
            expect(typeof manager.validateData).toBe('function');
            expect(typeof manager.generatePreview).toBe('function');
            expect(typeof manager.processBatch).toBe('function');
            expect(typeof manager.generateReport).toBe('function');
            expect(typeof manager.cancelProcessing).toBe('function');
        });

        test('uploadFile should throw component not available error', async () => {
            const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
            await expect(manager.uploadFile(mockFile)).rejects.toThrow('FileParser component not available');
        });

        test('validateData should throw component not available error', async () => {
            const mockData = [{ test: 'data' }];
            await expect(manager.validateData(mockData)).rejects.toThrow('ValidationEngine component not available');
        });

        test('generatePreview should throw component not available error', async () => {
            const mockData = [{ test: 'data' }];
            await expect(manager.generatePreview(mockData)).rejects.toThrow('PreviewGenerator component not available');
        });

        test('processBatch should throw component not available error', async () => {
            const mockData = [{ test: 'data' }];
            await expect(manager.processBatch(mockData)).rejects.toThrow('BatchProcessor component not available');
        });

        test('generateReport should throw component not available error', async () => {
            const mockResults = { test: 'results' };
            await expect(manager.generateReport(mockResults)).rejects.toThrow('ReportGenerator component not available');
        });

        test('cancelProcessing should return no processing message when not processing', async () => {
            const result = await manager.cancelProcessing();
            expect(result.success).toBe(false);
            expect(result.message).toContain('No processing in progress');
        });
    });

    describe('Template Generation', () => {
        test('generateTemplate should return template with required structure', () => {
            const template = manager.generateTemplate();
            
            expect(template).toHaveProperty('filename');
            expect(template).toHaveProperty('content');
            expect(template).toHaveProperty('mimeType', 'text/csv');
            expect(template).toHaveProperty('size');
            expect(template).toHaveProperty('timestamp');
            expect(template).toHaveProperty('headers');
            expect(template).toHaveProperty('exampleCount');
            
            // Verify required columns
            const expectedHeaders = ['nomor_anggota', 'nama_anggota', 'jenis_pembayaran', 'jumlah_pembayaran', 'keterangan'];
            expect(template.headers).toEqual(expectedHeaders);
            
            // Verify filename format with timestamp and counter for uniqueness
            expect(template.filename).toMatch(/^template_import_tagihan_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}_\d+\.csv$/);
            
            // Verify content includes headers and examples
            expect(template.content).toContain('nomor_anggota,nama_anggota,jenis_pembayaran,jumlah_pembayaran,keterangan');
            expect(template.content).toContain('001,John Doe,hutang,500000,Cicilan bulan Januari');
            expect(template.content).toContain('002,Jane Smith,piutang,300000,Pengembalian simpanan');
            
            // Verify instructions are included
            expect(template.content).toContain('INSTRUKSI PENGISIAN TEMPLATE IMPORT TAGIHAN');
            expect(template.content).toContain('nomor_anggota: Nomor anggota/NIK yang terdaftar di sistem');
        });

        /**
         * Property 1: Template download consistency
         * Feature: import-tagihan-pembayaran, Property 1: Template download consistency
         * Validates: Requirements 1.2, 1.3
         */
        test('Property 1: Template download consistency', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 100 }), (iterations) => {
                    // Generate multiple templates
                    const templates = [];
                    for (let i = 0; i < iterations; i++) {
                        templates.push(manager.generateTemplate());
                    }
                    
                    // All templates should have the same required columns (Requirements 1.2)
                    const expectedHeaders = ['nomor_anggota', 'nama_anggota', 'jenis_pembayaran', 'jumlah_pembayaran', 'keterangan'];
                    const allHaveSameHeaders = templates.every(template => 
                        template.headers.length === expectedHeaders.length &&
                        template.headers.every((header, index) => header === expectedHeaders[index])
                    );
                    
                    // All templates should contain example data (Requirements 1.3)
                    const allHaveExampleData = templates.every(template => 
                        template.content.includes('001,John Doe,hutang,500000,Cicilan bulan Januari') &&
                        template.content.includes('002,Jane Smith,piutang,300000,Pengembalian simpanan') &&
                        template.exampleCount === 2
                    );
                    
                    // All templates should have unique timestamped filenames (Requirements 1.5)
                    const filenames = templates.map(t => t.filename);
                    const uniqueFilenames = new Set(filenames);
                    const allFilenamesUnique = uniqueFilenames.size === filenames.length;
                    
                    // All filenames should follow the correct pattern (with milliseconds and counter for uniqueness)
                    const allFilenamesValid = templates.every(template =>
                        /^template_import_tagihan_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}_\d+\.csv$/.test(template.filename)
                    );
                    
                    // All templates should have instructions (Requirements 1.4)
                    const allHaveInstructions = templates.every(template =>
                        template.content.includes('INSTRUKSI PENGISIAN TEMPLATE IMPORT TAGIHAN') &&
                        template.content.includes('nomor_anggota: Nomor anggota/NIK yang terdaftar di sistem') &&
                        template.content.includes('jenis_pembayaran: "hutang" atau "piutang"') &&
                        template.content.includes('File maksimal 5MB dengan maksimal 1000 baris data')
                    );
                    
                    // All templates should have correct MIME type and size
                    const allHaveCorrectMetadata = templates.every(template =>
                        template.mimeType === 'text/csv' &&
                        template.size === template.content.length &&
                        template.size > 0
                    );
                    
                    return allHaveSameHeaders && 
                           allHaveExampleData && 
                           allFilenamesUnique && 
                           allFilenamesValid && 
                           allHaveInstructions && 
                           allHaveCorrectMetadata;
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Orchestration Methods', () => {
        test('should have orchestration methods available', () => {
            expect(typeof manager.executeCompleteWorkflow).toBe('function');
            expect(typeof manager.completeProcessing).toBe('function');
            expect(typeof manager.setProgressCallback).toBe('function');
            expect(typeof manager.getState).toBe('function');
            expect(typeof manager.reset).toBe('function');
            expect(typeof manager.downloadReport).toBe('function');
        });

        test('getState should return current state', () => {
            const state = manager.getState();
            expect(state).toHaveProperty('workflowState');
            expect(state).toHaveProperty('isProcessing');
            expect(state).toHaveProperty('isCancelled');
            expect(state).toHaveProperty('currentBatch');
            expect(state.workflowState).toBe('idle');
            expect(state.isProcessing).toBe(false);
            expect(state.isCancelled).toBe(false);
            expect(state.currentBatch).toBeNull();
        });

        test('reset should clear all state', () => {
            // Set some state
            manager.currentBatch = { id: 'test' };
            manager.isProcessing = true;
            manager.isCancelled = true;
            manager.workflowState = 'processing';

            // Reset
            manager.reset();

            // Verify state is cleared
            const state = manager.getState();
            expect(state.workflowState).toBe('idle');
            expect(state.isProcessing).toBe(false);
            expect(state.isCancelled).toBe(false);
            expect(state.currentBatch).toBeNull();
        });

        test('setProgressCallback should set callback function', () => {
            const mockCallback = jest.fn();
            manager.setProgressCallback(mockCallback);
            expect(manager.progressCallback).toBe(mockCallback);
        });
    });

    describe('Cancellation Functionality', () => {
        test('cancelProcessing should return false when no processing in progress', async () => {
            const result = await manager.cancelProcessing();
            expect(result.success).toBe(false);
            expect(result.message).toContain('No processing in progress');
        });

        test('cancelProcessing should work when processing is in progress', async () => {
            // Set processing state
            manager.isProcessing = true;
            manager.workflowState = 'processing';
            manager.currentBatch = { id: 'test-batch', status: 'processing' };

            const result = await manager.cancelProcessing();
            expect(result.success).toBe(true);
            expect(result.message).toContain('cancelled');
            expect(manager.workflowState).toBe('cancelled');
        });



        /**
         * Property 11: Cancellation responsiveness
         * Feature: import-tagihan-pembayaran, Property 11: Cancellation responsiveness
         * Validates: Requirements 10.2
         */
        test('Property 11: Cancellation responsiveness', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        processingState: fc.constantFrom('uploading', 'validating', 'previewing', 'processing'),
                        hasBatchProcessor: fc.boolean()
                    }),
                    async (testData) => {
                        // Create a fresh manager for each test
                        const testManager = new ImportTagihanManager(mockPaymentEngine, mockAuditLogger);
                        
                        // Mock batch processor if needed
                        if (testData.hasBatchProcessor) {
                            testManager.batchProcessor = {
                                handleCancellation: jest.fn().mockResolvedValue({
                                    success: true,
                                    message: 'Batch processing cancelled',
                                    rollbackResult: { success: true, rolledBackCount: 0 }
                                })
                            };
                        }

                        // Simulate processing state
                        testManager.isProcessing = true;
                        testManager.workflowState = testData.processingState;
                        testManager.currentBatch = {
                            id: `batch_${Date.now()}_${Math.random()}`,
                            status: testData.processingState
                        };

                        try {
                            // Attempt cancellation
                            const result = await testManager.cancelProcessing();
                            
                            // Verify cancellation was successful
                            const cancellationSuccessful = result.success === true;
                            const hasMessage = typeof result.message === 'string' && result.message.length > 0;
                            const workflowStateUpdated = testManager.workflowState === 'cancelled';
                            const batchStatusUpdated = testManager.currentBatch?.status === 'cancelled';

                            // For batch processor scenarios, verify it was called
                            if (testData.hasBatchProcessor && testManager.batchProcessor) {
                                const batchProcessorCalled = testManager.batchProcessor.handleCancellation.mock.calls.length > 0;
                                return cancellationSuccessful && 
                                       hasMessage && 
                                       workflowStateUpdated && 
                                       batchStatusUpdated &&
                                       batchProcessorCalled;
                            }

                            return cancellationSuccessful && 
                                   hasMessage && 
                                   workflowStateUpdated && 
                                   batchStatusUpdated;

                        } catch (error) {
                            // Cancellation should not throw errors, it should return error result
                            return false;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});