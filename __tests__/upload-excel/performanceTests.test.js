/**
 * Performance Tests for Large Datasets
 * Tests with files containing 1000+ records
 * Validates memory usage and processing time
 */

import ExcelUploadManager from '../../js/upload-excel/ExcelUploadManager.js';
import MasterBarangIntegration from '../../js/upload-excel/MasterBarangIntegration.js';
import ValidationEngine from '../../js/upload-excel/ValidationEngine.js';
import DataProcessor from '../../js/upload-excel/DataProcessor.js';
import AuditLogger from '../../js/upload-excel/AuditLogger.js';

describe('Performance Tests: Large Datasets', () => {
    let integration;
    let validationEngine;
    let dataProcessor;
    let auditLogger;

    beforeEach(() => {
        localStorage.clear();
        integration = new MasterBarangIntegration();
        validationEngine = new ValidationEngine();
        dataProcessor = new DataProcessor();
        auditLogger = new AuditLogger();
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Generate large CSV data for testing
     * @param {number} recordCount - Number of records to generate
     * @returns {string} CSV data
     */
    function generateLargeCSVData(recordCount) {
        const headers = 'kode,nama,kategori,satuan,harga_beli,stok,supplier\n';
        const categories = ['makanan', 'minuman', 'alat-tulis', 'elektronik', 'kebersihan'];
        const units = ['pcs', 'kg', 'liter', 'box', 'botol'];
        const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E'];
        
        let csvData = headers;
        
        for (let i = 1; i <= recordCount; i++) {
            const kode = `BRG${i.toString().padStart(6, '0')}`;
            const nama = `Test Item ${i}`;
            const kategori = categories[i % categories.length];
            const satuan = units[i % units.length];
            const harga_beli = Math.floor(Math.random() * 100000) + 1000;
            const stok = Math.floor(Math.random() * 1000) + 1;
            const supplier = suppliers[i % suppliers.length];
            
            csvData += `${kode},"${nama}",${kategori},${satuan},${harga_beli},${stok},"${supplier}"\n`;
        }
        
        return csvData;
    }

    /**
     * Measure memory usage (approximation)
     * @returns {number} Memory usage in MB
     */
    function getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / (1024 * 1024);
        }
        return 0; // Not available in all browsers
    }

    describe('Large File Processing Performance', () => {
        test('should process 1000 records within acceptable time limits', async () => {
            // Arrange
            const recordCount = 1000;
            const csvData = generateLargeCSVData(recordCount);
            const maxProcessingTime = 5000; // 5 seconds
            
            console.log(`Testing with ${recordCount} records, CSV size: ${(csvData.length / 1024).toFixed(2)} KB`);
            
            // Act & Measure
            const startTime = performance.now();
            const startMemory = getMemoryUsage();
            
            const parsedData = await dataProcessor.parseCSV(csvData);
            const parseTime = performance.now();
            
            const validationResults = validationEngine.validateData(parsedData);
            const validationTime = performance.now();
            
            const endMemory = getMemoryUsage();
            const totalTime = validationTime - startTime;
            
            // Assert Performance Requirements
            expect(totalTime).toBeLessThan(maxProcessingTime);
            expect(parsedData).toHaveLength(recordCount);
            expect(validationResults.errors).toHaveLength(0);
            
            // Log performance metrics
            console.log(`Parse time: ${(parseTime - startTime).toFixed(2)}ms`);
            console.log(`Validation time: ${(validationTime - parseTime).toFixed(2)}ms`);
            console.log(`Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`Memory usage: ${(endMemory - startMemory).toFixed(2)}MB increase`);
            
            // Performance assertions
            expect(parseTime - startTime).toBeLessThan(2000); // Parse should be under 2 seconds
            expect(validationTime - parseTime).toBeLessThan(3000); // Validation should be under 3 seconds
        });

        test('should process 5000 records efficiently', async () => {
            // Arrange
            const recordCount = 5000;
            const csvData = generateLargeCSVData(recordCount);
            const maxProcessingTime = 15000; // 15 seconds for larger dataset
            
            console.log(`Testing with ${recordCount} records, CSV size: ${(csvData.length / 1024).toFixed(2)} KB`);
            
            // Act & Measure
            const startTime = performance.now();
            const startMemory = getMemoryUsage();
            
            const parsedData = await dataProcessor.parseCSV(csvData);
            const validationResults = validationEngine.validateData(parsedData);
            
            const endTime = performance.now();
            const endMemory = getMemoryUsage();
            const totalTime = endTime - startTime;
            
            // Assert
            expect(totalTime).toBeLessThan(maxProcessingTime);
            expect(parsedData).toHaveLength(recordCount);
            expect(validationResults.errors).toHaveLength(0);
            
            console.log(`Total processing time: ${totalTime.toFixed(2)}ms`);
            console.log(`Memory usage: ${(endMemory - startMemory).toFixed(2)}MB increase`);
            console.log(`Processing rate: ${(recordCount / (totalTime / 1000)).toFixed(0)} records/second`);
            
            // Should process at least 100 records per second
            expect(recordCount / (totalTime / 1000)).toBeGreaterThan(100);
        });

        test('should handle chunked processing for very large datasets', async () => {
            // Arrange
            const recordCount = 2000;
            const chunkSize = 500;
            const csvData = generateLargeCSVData(recordCount);
            
            // Act: Process in chunks
            const startTime = performance.now();
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            // Simulate chunked processing
            const chunks = [];
            for (let i = 0; i < parsedData.length; i += chunkSize) {
                chunks.push(parsedData.slice(i, i + chunkSize));
            }
            
            let totalProcessed = 0;
            const chunkTimes = [];
            
            for (const chunk of chunks) {
                const chunkStart = performance.now();
                const chunkValidation = validationEngine.validateData(chunk);
                const chunkEnd = performance.now();
                
                chunkTimes.push(chunkEnd - chunkStart);
                totalProcessed += chunk.length;
                
                expect(chunkValidation.errors).toHaveLength(0);
            }
            
            const endTime = performance.now();
            
            // Assert
            expect(totalProcessed).toBe(recordCount);
            expect(chunks).toHaveLength(Math.ceil(recordCount / chunkSize));
            
            // Chunked processing should be consistent
            const avgChunkTime = chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length;
            const maxChunkTime = Math.max(...chunkTimes);
            const minChunkTime = Math.min(...chunkTimes);
            
            console.log(`Chunks processed: ${chunks.length}`);
            console.log(`Average chunk time: ${avgChunkTime.toFixed(2)}ms`);
            console.log(`Min/Max chunk time: ${minChunkTime.toFixed(2)}ms / ${maxChunkTime.toFixed(2)}ms`);
            
            // Chunk processing should be relatively consistent (max shouldn't be more than 3x min)
            expect(maxChunkTime / minChunkTime).toBeLessThan(3);
        });
    });

    describe('Import Performance', () => {
        test('should import 1000 records within acceptable time', async () => {
            // Arrange
            const recordCount = 1000;
            const csvData = generateLargeCSVData(recordCount);
            const maxImportTime = 10000; // 10 seconds
            
            const sessionId = auditLogger.logUploadStart('perf_test_user', 'large_test.csv', recordCount);
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            // Act & Measure Import
            const startTime = performance.now();
            const startMemory = getMemoryUsage();
            
            const importResults = integration.bulkImportBarang(parsedData, sessionId);
            
            const endTime = performance.now();
            const endMemory = getMemoryUsage();
            const importTime = endTime - startTime;
            
            // Assert
            expect(importTime).toBeLessThan(maxImportTime);
            expect(importResults.created).toBe(recordCount);
            expect(importResults.failed).toBe(0);
            expect(importResults.totalProcessed).toBe(recordCount);
            
            // Verify data was saved correctly
            const savedData = integration.getExistingMasterBarang();
            expect(savedData).toHaveLength(recordCount);
            
            console.log(`Import time: ${importTime.toFixed(2)}ms`);
            console.log(`Import rate: ${(recordCount / (importTime / 1000)).toFixed(0)} records/second`);
            console.log(`Memory usage during import: ${(endMemory - startMemory).toFixed(2)}MB increase`);
            
            // Should import at least 50 records per second
            expect(recordCount / (importTime / 1000)).toBeGreaterThan(50);
        });

        test('should handle mixed operations (create/update) efficiently', async () => {
            // Arrange: Create existing data
            const existingCount = 500;
            const newCount = 500;
            const totalCount = existingCount + newCount;
            
            // Add existing data
            const existingData = [];
            for (let i = 1; i <= existingCount; i++) {
                existingData.push({
                    kode: `BRG${i.toString().padStart(6, '0')}`,
                    nama: `Existing Item ${i}`,
                    kategori: 'makanan',
                    satuan: 'pcs',
                    harga_beli: 5000,
                    stok: 10,
                    supplier: 'Existing Supplier',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
            integration.saveMasterBarang(existingData);
            
            // Create CSV with mix of updates and new items
            let csvData = 'kode,nama,kategori,satuan,harga_beli,stok,supplier\n';
            
            // Updates for existing items (first 500)
            for (let i = 1; i <= existingCount; i++) {
                const kode = `BRG${i.toString().padStart(6, '0')}`;
                csvData += `${kode},"Updated Item ${i}",makanan,pcs,7000,20,"Updated Supplier"\n`;
            }
            
            // New items (next 500)
            for (let i = existingCount + 1; i <= totalCount; i++) {
                const kode = `BRG${i.toString().padStart(6, '0')}`;
                csvData += `${kode},"New Item ${i}",minuman,botol,3000,15,"New Supplier"\n`;
            }
            
            const sessionId = auditLogger.logUploadStart('perf_test_user', 'mixed_ops.csv', totalCount);
            const parsedData = await dataProcessor.parseCSV(csvData);
            
            // Act & Measure
            const startTime = performance.now();
            const importResults = integration.bulkImportBarang(parsedData, sessionId);
            const endTime = performance.now();
            
            const importTime = endTime - startTime;
            
            // Assert
            expect(importResults.created).toBe(newCount);
            expect(importResults.updated).toBe(existingCount);
            expect(importResults.failed).toBe(0);
            expect(importResults.totalProcessed).toBe(totalCount);
            
            const finalData = integration.getExistingMasterBarang();
            expect(finalData).toHaveLength(totalCount);
            
            // Verify updates worked
            const updatedItem = finalData.find(item => item.kode === 'BRG000001');
            expect(updatedItem.nama).toBe('Updated Item 1');
            expect(updatedItem.harga_beli).toBe(7000);
            
            // Verify new items were added
            const newItem = finalData.find(item => item.kode === 'BRG000501');
            expect(newItem.nama).toBe('New Item 501');
            expect(newItem.kategori).toBe('minuman');
            
            console.log(`Mixed operations time: ${importTime.toFixed(2)}ms`);
            console.log(`Operations rate: ${(totalCount / (importTime / 1000)).toFixed(0)} ops/second`);
            
            // Should handle at least 30 mixed operations per second
            expect(totalCount / (importTime / 1000)).toBeGreaterThan(30);
        });
    });

    describe('Memory Management', () => {
        test('should not cause memory leaks with repeated operations', async () => {
            const recordCount = 500;
            const iterations = 5;
            const memoryMeasurements = [];
            
            for (let i = 0; i < iterations; i++) {
                // Clear previous data
                localStorage.clear();
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                
                const startMemory = getMemoryUsage();
                
                // Generate and process data
                const csvData = generateLargeCSVData(recordCount);
                const parsedData = await dataProcessor.parseCSV(csvData);
                const validationResults = validationEngine.validateData(parsedData);
                
                const sessionId = auditLogger.logUploadStart('memory_test', `test_${i}.csv`, recordCount);
                const importResults = integration.bulkImportBarang(parsedData, sessionId);
                
                const endMemory = getMemoryUsage();
                const memoryIncrease = endMemory - startMemory;
                memoryMeasurements.push(memoryIncrease);
                
                console.log(`Iteration ${i + 1}: Memory increase ${memoryIncrease.toFixed(2)}MB`);
                
                // Each iteration should not use significantly more memory than the first
                if (i > 0) {
                    expect(memoryIncrease).toBeLessThan(memoryMeasurements[0] * 2);
                }
            }
            
            // Memory usage should be relatively stable across iterations
            const avgMemory = memoryMeasurements.reduce((a, b) => a + b, 0) / memoryMeasurements.length;
            const maxMemory = Math.max(...memoryMeasurements);
            
            console.log(`Average memory increase: ${avgMemory.toFixed(2)}MB`);
            console.log(`Maximum memory increase: ${maxMemory.toFixed(2)}MB`);
            
            // Max shouldn't be more than 50% higher than average
            expect(maxMemory).toBeLessThan(avgMemory * 1.5);
        });

        test('should handle localStorage size limits gracefully', async () => {
            // Test with data that approaches localStorage limits
            const recordCount = 10000; // Large dataset
            const csvData = generateLargeCSVData(recordCount);
            
            try {
                const parsedData = await dataProcessor.parseCSV(csvData);
                const sessionId = auditLogger.logUploadStart('storage_test', 'large_storage_test.csv', recordCount);
                
                // This might fail due to localStorage limits, which is expected
                const importResults = integration.bulkImportBarang(parsedData, sessionId);
                
                // If it succeeds, verify the data
                if (importResults.failed === 0) {
                    const savedData = integration.getExistingMasterBarang();
                    expect(savedData).toHaveLength(recordCount);
                }
                
                console.log(`Successfully stored ${recordCount} records`);
                
            } catch (error) {
                // Storage limit reached - this is acceptable behavior
                console.log(`Storage limit reached with ${recordCount} records: ${error.message}`);
                expect(error.message).toMatch(/storage|quota|limit/i);
            }
        });
    });

    describe('Concurrent Operations', () => {
        test('should handle multiple simultaneous operations', async () => {
            const operationCount = 3;
            const recordsPerOperation = 300;
            
            // Create multiple operations
            const operations = [];
            
            for (let i = 0; i < operationCount; i++) {
                const operation = async () => {
                    const csvData = generateLargeCSVData(recordsPerOperation);
                    const parsedData = await dataProcessor.parseCSV(csvData);
                    
                    // Add unique prefix to avoid conflicts
                    const prefixedData = parsedData.map((item, index) => ({
                        ...item,
                        kode: `OP${i}_${item.kode}`
                    }));
                    
                    const sessionId = auditLogger.logUploadStart('concurrent_test', `op_${i}.csv`, recordsPerOperation);
                    return integration.bulkImportBarang(prefixedData, sessionId);
                };
                
                operations.push(operation());
            }
            
            // Execute all operations concurrently
            const startTime = performance.now();
            const results = await Promise.all(operations);
            const endTime = performance.now();
            
            const totalTime = endTime - startTime;
            
            // Assert all operations completed successfully
            results.forEach((result, index) => {
                expect(result.created).toBe(recordsPerOperation);
                expect(result.failed).toBe(0);
                console.log(`Operation ${index + 1}: ${result.created} created, ${result.totalProcessed} processed`);
            });
            
            // Verify all data was saved
            const finalData = integration.getExistingMasterBarang();
            expect(finalData).toHaveLength(operationCount * recordsPerOperation);
            
            console.log(`Concurrent operations completed in: ${totalTime.toFixed(2)}ms`);
            console.log(`Total records processed: ${operationCount * recordsPerOperation}`);
            
            // Concurrent operations should not take significantly longer than sequential
            // (allowing for some overhead)
            const expectedSequentialTime = operationCount * 2000; // Rough estimate
            expect(totalTime).toBeLessThan(expectedSequentialTime * 1.5);
        });
    });
});