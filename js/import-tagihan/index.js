/**
 * Import Tagihan Pembayaran - Main Module
 * Requirements: 1.1, 2.1, 3.1
 * 
 * This module exports all the core components for the import tagihan feature
 */

export { ImportTagihanManager } from './ImportTagihanManager.js';
export { FileParser } from './FileParser.js';
export { ValidationEngine } from './ValidationEngine.js';
export { BatchProcessor } from './BatchProcessor.js';
export { PreviewGenerator } from './PreviewGenerator.js';
export { AuditLogger } from './AuditLogger.js';
export { ReportGenerator } from './ReportGenerator.js';

// Re-export interfaces for documentation
export * from './interfaces.js';

/**
 * Initialize import tagihan components with default configuration
 * @param {Object} paymentEngine - Payment processing engine
 * @param {Object} auditLogger - Audit logging system
 * @returns {Object} Initialized components
 */
export function initializeImportTagihan(paymentEngine, auditLogger) {
    const fileParser = new FileParser();
    const validationEngine = new ValidationEngine();
    const batchProcessor = new BatchProcessor(paymentEngine, auditLogger);
    const previewGenerator = new PreviewGenerator();
    const reportGenerator = new ReportGenerator();
    const manager = new ImportTagihanManager(paymentEngine, auditLogger);

    return {
        manager,
        fileParser,
        validationEngine,
        batchProcessor,
        previewGenerator,
        auditLogger,
        reportGenerator
    };
}

// Browser environment setup
if (typeof window !== 'undefined') {
    window.ImportTagihan = {
        ImportTagihanManager,
        FileParser,
        ValidationEngine,
        BatchProcessor,
        PreviewGenerator,
        AuditLogger,
        ReportGenerator,
        initializeImportTagihan
    };
}