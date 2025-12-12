/**
 * Integration Tests: End-to-End Workflow
 * Tests complete upload process from file selection to import completion
 * 
 * Validates cross-component interactions and error scenarios
 */

import ExcelUploadManager from '../../js/upload-excel/ExcelUploadManager.js';
import MasterBarangIntegration from '../../js/upload-excel/MasterBarangIntegration.js';
import ValidationEngine from '../../js/upload-excel/ValidationEngine.js';
import DataProcessor from '../../js/upload-excel/DataProcessor.js';
import AuditLogger from '../../js/upload-excel/AuditLogger.js';

describe('Integration Tests: End-to-End Workflow', () => {
    let uploadManager;
    let integration;
    let validationEngine;
    let dataProcessor;
    let auditLogger;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Initialize components
        uploadManager = new ExcelUploadManager();
        integration = new MasterBarangIntegration();
        validationEngine = new ValidationEngine();
        dataProcessor = new DataProcessor();
        auditLogger = new AuditLogger();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Complete Upload Workflow', () => {
        test('should handle complete upload workflow successfully', async () => {
            // Arrange: Create test CSV data
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Test Item 1,makanan,pcs,10000,50,Test Supplier
BRG002,Test Item 2,minuman,botol,5000,30,Test Supplier 2`;

            const mockFile = new File([csvData], 'test.csv', { type: 'text/csv' });

            // Act & Assert: Step 1 - File Upload and Parsing
            const sessionId = auditLogger.logUploadStart('test_user', mockFile.name, 2);
            expect(sessionId).toBeDefined();

            // Parse the file
            const parsedData = await dataProcessor.parseCSV(csvData);
            expect(parsedData).toHaveLength(2);
            expect(parsedData[0].kode).toBe('BRG001');
            expect(parsedData[1].kode).toBe('BRG002');

            // Step 2 - Validation
            const validationResults = validationEngine.validateData(parsedData);
            expect(validationResults.errors).toHaveLength(0);
            auditLogger.logValidationResults(sessionId, validationResults);

            // Step 3 - Integration validation
            const integrationValidation = integration.validateAgainstExistingData(parsedData);
            expect(integrationValidation.duplicates).toHaveLength(0);
            expect(integrationValidation.existingItems).toHaveLength(0);

            // Step 4 - Import
            const importResults = integration.bulkImportBarang(parsedData, sessionId);
            expect(importResults.created).toBe(2);
            expect(importResults.updated).toBe(0);
            expect(importResults.failed).toBe(0);
            expect(importResults.totalProcessed).toBe(2);

            // Verify data was saved
            const savedData = integration.getExistingMasterBarang();
            expect(savedData).toHaveLength(2);
            expect(savedData.find(item => item.kode === 'BRG001')).toBeDefined();
            expect(savedData.find(item => item.kode === 'BRG002')).toBeDefined();

            // Verify audit trail
            const auditTrail = auditLogger.getAuditTrail({ sessionId });
            expect(auditTrail.length).toBeGreaterThan(0);
            expect(auditTrail.some(entry => entry.action === 'upload_start')).toBe(true);
            expect(auditTrail.some(entry => entry.action === 'validation_complete')).toBe(true);
            expect(auditTrail.some(entry => entry.action === 'import_complete')).toBe(true);
        });

        test('should handle update workflow for existing items', async () => {
            // Arrange: Add existing data
            const existingData = [{
                kode: 'BRG001',
                nama: 'Old Item',
                kategori: 'makanan',
                satuan: 'pcs',
                harga_beli: 8000,
                stok: 20,
                supplier: 'Old Supplier',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }];
            integration.saveMasterBarang(existingData);

            // New data with same code but different values
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Updated Item,makanan,pcs,12000,60,New Supplier`;

            const mockFile = new File([csvData], 'update.csv', { type: 'text/csv' });

            // Act: Process update
            const sessionId = auditLogger.logUploadStart('test_user', mockFile.name, 1);
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            const validationResults = validationEngine.validateData(parsedData);
            const integrationValidation = integration.validateAgainstExistingData(parsedData);
            
            // Should detect existing item
            expect(integrationValidation.existingItems).toHaveLength(1);
            expect(integrationValidation.existingItems[0].kode).toBe('BRG001');

            const importResults = integration.bulkImportBarang(parsedData, sessionId);

            // Assert: Should update existing item
            expect(importResults.created).toBe(0);
            expect(importResults.updated).toBe(1);
            expect(importResults.failed).toBe(0);

            const updatedData = integration.getExistingMasterBarang();
            expect(updatedData).toHaveLength(1);
            
            const updatedItem = updatedData.find(item => item.kode === 'BRG001');
            expect(updatedItem.nama).toBe('Updated Item');
            expect(updatedItem.harga_beli).toBe(12000);
            expect(updatedItem.stok).toBe(60);
            expect(updatedItem.supplier).toBe('New Supplier');

            // Verify audit trail includes data changes
            const auditTrail = auditLogger.getAuditTrail({ sessionId });
            const dataChangeEntries = auditTrail.filter(entry => entry.action === 'data_change');
            expect(dataChangeEntries).toHaveLength(1);
            expect(dataChangeEntries[0].oldData.nama).toBe('Old Item');
            expect(dataChangeEntries[0].newData.nama).toBe('Updated Item');
        });

        test('should handle validation errors gracefully', async () => {
            // Arrange: Create CSV with validation errors
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
,Missing Code,makanan,pcs,10000,50,Test Supplier
BRG002,,minuman,botol,-5000,30,Test Supplier 2
BRG003,Valid Item,makanan,pcs,8000,-10,Test Supplier 3`;

            const mockFile = new File([csvData], 'errors.csv', { type: 'text/csv' });

            // Act: Process file with errors
            const sessionId = auditLogger.logUploadStart('test_user', mockFile.name, 3);
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            const validationResults = validationEngine.validateData(parsedData);

            // Assert: Should detect validation errors
            expect(validationResults.errors.length).toBeGreaterThan(0);
            
            // Should have errors for missing code, missing name, negative price, negative stock
            const errorMessages = validationResults.errors.map(e => e.message);
            expect(errorMessages.some(msg => msg.includes('kode'))).toBe(true);
            expect(errorMessages.some(msg => msg.includes('nama'))).toBe(true);
            expect(errorMessages.some(msg => msg.includes('harga_beli'))).toBe(true);
            expect(errorMessages.some(msg => msg.includes('stok'))).toBe(true);

            // Log validation results
            auditLogger.logValidationResults(sessionId, validationResults);

            // Verify audit trail includes validation errors
            const auditTrail = auditLogger.getAuditTrail({ sessionId });
            const validationEntry = auditTrail.find(entry => entry.action === 'validation_complete');
            expect(validationEntry).toBeDefined();
            expect(validationEntry.details.errorCount).toBeGreaterThan(0);
        });

        test('should handle duplicate detection', async () => {
            // Arrange: Create CSV with duplicates
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Item 1,makanan,pcs,10000,50,Test Supplier
BRG002,Item 2,minuman,botol,5000,30,Test Supplier 2
BRG001,Duplicate Item,makanan,pcs,12000,40,Test Supplier 3`;

            const mockFile = new File([csvData], 'duplicates.csv', { type: 'text/csv' });

            // Act: Process file with duplicates
            const sessionId = auditLogger.logUploadStart('test_user', mockFile.name, 3);
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            const validationResults = validationEngine.validateData(parsedData);
            const integrationValidation = integration.validateAgainstExistingData(parsedData);

            // Assert: Should detect duplicates
            expect(integrationValidation.duplicates).toHaveLength(1);
            expect(integrationValidation.duplicates[0].kode).toBe('BRG001');
            expect(integrationValidation.duplicates[0].message).toContain('Duplicate');

            // Should prevent import due to duplicates
            expect(validationResults.errors.some(e => e.message.includes('duplicate'))).toBe(true);
        });

        test('should handle category and unit auto-creation', async () => {
            // Arrange: Create CSV with new categories and units
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,New Category Item,new_category,new_unit,10000,50,Test Supplier
BRG002,Another New Item,another_category,another_unit,5000,30,Test Supplier 2`;

            const mockFile = new File([csvData], 'new_categories.csv', { type: 'text/csv' });

            // Act: Process file with new categories/units
            const sessionId = auditLogger.logUploadStart('test_user', mockFile.name, 2);
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            const integrationValidation = integration.validateAgainstExistingData(parsedData);

            // Assert: Should detect new categories and units
            expect(integrationValidation.newCategories).toHaveLength(2);
            expect(integrationValidation.newUnits).toHaveLength(2);
            
            const categoryNames = integrationValidation.newCategories.map(c => c.name);
            const unitNames = integrationValidation.newUnits.map(u => u.name);
            
            expect(categoryNames).toContain('new_category');
            expect(categoryNames).toContain('another_category');
            expect(unitNames).toContain('new_unit');
            expect(unitNames).toContain('another_unit');

            // Import should create new categories and units
            const importResults = integration.bulkImportBarang(parsedData, sessionId);
            expect(importResults.created).toBe(2);

            // Verify categories and units were created
            const categories = integration.getExistingCategories();
            const units = integration.getExistingUnits();
            
            expect(categories).toContain('new_category');
            expect(categories).toContain('another_category');
            expect(units).toContain('new_unit');
            expect(units).toContain('another_unit');
        });
    });

    describe('Error Recovery Scenarios', () => {
        test('should handle partial import failures', async () => {
            // Arrange: Mix of valid and invalid data
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Valid Item 1,makanan,pcs,10000,50,Test Supplier
INVALID,Invalid Item,,pcs,-1000,-50,Test Supplier
BRG003,Valid Item 2,minuman,botol,5000,30,Test Supplier 2`;

            const mockFile = new File([csvData], 'partial_fail.csv', { type: 'text/csv' });

            // Act: Process mixed data
            const sessionId = auditLogger.logUploadStart('test_user', mockFile.name, 3);
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            // Filter out invalid data for import (in real scenario, validation would prevent this)
            const validData = parsedData.filter(item => 
                item.kode && item.kode !== 'INVALID' && 
                item.nama && 
                item.kategori && 
                item.harga_beli >= 0 && 
                item.stok >= 0
            );

            const importResults = integration.bulkImportBarang(validData, sessionId);

            // Assert: Should import only valid items
            expect(importResults.created).toBe(2);
            expect(importResults.totalProcessed).toBe(2);

            const savedData = integration.getExistingMasterBarang();
            expect(savedData).toHaveLength(2);
            expect(savedData.find(item => item.kode === 'BRG001')).toBeDefined();
            expect(savedData.find(item => item.kode === 'BRG003')).toBeDefined();
            expect(savedData.find(item => item.kode === 'INVALID')).toBeUndefined();
        });

        test('should maintain data integrity during errors', async () => {
            // Arrange: Add existing data
            const existingData = [{
                kode: 'EXISTING001',
                nama: 'Existing Item',
                kategori: 'makanan',
                satuan: 'pcs',
                harga_beli: 8000,
                stok: 20,
                supplier: 'Existing Supplier',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }];
            integration.saveMasterBarang(existingData);

            // Simulate error during import
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,New Item,makanan,pcs,10000,50,Test Supplier`;

            const sessionId = auditLogger.logUploadStart('test_user', 'test.csv', 1);
            const parsedData = await dataProcessor.parseCSV(csvData);

            // Mock an error during import
            const originalSave = integration.saveMasterBarang;
            let saveCallCount = 0;
            integration.saveMasterBarang = (data) => {
                saveCallCount++;
                if (saveCallCount === 1) {
                    // First call succeeds (existing data preserved)
                    return originalSave.call(integration, data);
                } else {
                    // Subsequent calls fail
                    throw new Error('Simulated storage error');
                }
            };

            // Act: Attempt import with error
            let importError;
            try {
                integration.bulkImportBarang(parsedData, sessionId);
            } catch (error) {
                importError = error;
            }

            // Restore original method
            integration.saveMasterBarang = originalSave;

            // Assert: Existing data should be preserved
            const finalData = integration.getExistingMasterBarang();
            expect(finalData).toHaveLength(1);
            expect(finalData[0].kode).toBe('EXISTING001');
            expect(finalData[0].nama).toBe('Existing Item');
        });
    });

    describe('Cross-Component Integration', () => {
        test('should integrate validation engine with data processor', async () => {
            // Arrange: Create test data with various validation scenarios
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Valid Item,makanan,pcs,10000,50,Test Supplier
BRG002,Another Valid,minuman,botol,5000.50,30,Test Supplier 2`;

            // Act: Process through both components
            const parsedData = await dataProcessor.parseCSV(csvData);
            const validationResults = validationEngine.validateData(parsedData);

            // Assert: Components should work together seamlessly
            expect(parsedData).toHaveLength(2);
            expect(validationResults.errors).toHaveLength(0);
            expect(validationResults.warnings).toHaveLength(0);

            // Verify data types are correctly processed
            expect(typeof parsedData[0].harga_beli).toBe('number');
            expect(typeof parsedData[0].stok).toBe('number');
            expect(typeof parsedData[1].harga_beli).toBe('number');
            expect(parsedData[1].harga_beli).toBe(5000.50);
        });

        test('should integrate audit logger with all components', async () => {
            // Arrange: Create test workflow
            const csvData = `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Test Item,makanan,pcs,10000,50,Test Supplier`;

            // Act: Execute workflow with audit logging
            const sessionId = auditLogger.logUploadStart('test_user', 'test.csv', 1);
            const parsedData = await dataProcessor.parseCSV(csvData);
            const validationResults = validationEngine.validateData(parsedData);
            
            auditLogger.logValidationResults(sessionId, validationResults);
            
            const importResults = integration.bulkImportBarang(parsedData, sessionId);

            // Assert: All components should log to audit trail
            const auditTrail = auditLogger.getAuditTrail({ sessionId });
            
            expect(auditTrail.some(entry => entry.action === 'upload_start')).toBe(true);
            expect(auditTrail.some(entry => entry.action === 'validation_complete')).toBe(true);
            expect(auditTrail.some(entry => entry.action === 'data_change')).toBe(true);
            expect(auditTrail.some(entry => entry.action === 'import_complete')).toBe(true);

            // Verify audit entries have proper session correlation
            auditTrail.forEach(entry => {
                expect(entry.sessionId).toBe(sessionId);
                expect(entry.timestamp).toBeDefined();
                expect(entry.user).toBeDefined();
            });
        });

        test('should handle component initialization and dependencies', () => {
            // Act: Initialize components in different orders
            const integration1 = new MasterBarangIntegration();
            const auditLogger1 = new AuditLogger();
            const validationEngine1 = new ValidationEngine();

            const auditLogger2 = new AuditLogger();
            const integration2 = new MasterBarangIntegration();
            const validationEngine2 = new ValidationEngine();

            // Assert: All should initialize successfully regardless of order
            expect(integration1).toBeDefined();
            expect(auditLogger1).toBeDefined();
            expect(validationEngine1).toBeDefined();
            
            expect(integration2).toBeDefined();
            expect(auditLogger2).toBeDefined();
            expect(validationEngine2).toBeDefined();

            // Should have access to same data
            expect(integration1.getExistingMasterBarang()).toEqual(integration2.getExistingMasterBarang());
            expect(integration1.getExistingCategories()).toEqual(integration2.getExistingCategories());
        });
    });
});