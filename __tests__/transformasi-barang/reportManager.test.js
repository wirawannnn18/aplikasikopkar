/**
 * Property-based tests untuk ReportManager
 * Feature: transformasi-barang, Task 9: Implementasi reporting dan export functionality
 */

import fc from 'fast-check';

// Mock dependencies
class MockAuditLogger {
    constructor() {
        this.transformationLogs = [];
    }

    async getTransformationHistory(filters = {}) {
        let logs = [...this.transformationLogs];
        
        // Apply filters
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            logs = logs.filter(log => new Date(log.timestamp) >= fromDate);
        }
        
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            logs = logs.filter(log => new Date(log.timestamp) <= toDate);
        }
        
        if (filters.product) {
            logs = logs.filter(log => 
                log.metadata?.baseProduct?.toLowerCase().includes(filters.product.toLowerCase())
            );
        }
        
        if (filters.user) {
            logs = logs.filter(log => 
                log.user?.toLowerCase().includes(filters.user.toLowerCase())
            );
        }
        
        if (filters.status) {
            logs = logs.filter(log => log.status === filters.status);
        }
        
        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply pagination
        const totalCount = logs.length;
        const offset = filters.offset || 0;
        const limit = filters.limit || totalCount;
        const paginatedLogs = logs.slice(offset, offset + limit);
        
        return {
            data: paginatedLogs,
            metadata: {
                totalCount,
                offset,
                limit,
                hasMore: offset + limit < totalCount,
                filters: filters
            }
        };
    }

    async searchLogs(searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        
        return this.transformationLogs.filter(log => {
            const searchFields = [
                log.user,
                log.sourceItem?.name,
                log.targetItem?.name,
                log.sourceItem?.id,
                log.targetItem?.id,
                log.metadata?.baseProduct,
                log.transformationId
            ];
            
            return searchFields.some(field => 
                field && field.toString().toLowerCase().includes(searchTermLower)
            );
        });
    }

    addMockTransformation(transformation) {
        this.transformationLogs.push({
            id: transformation.id || `LOG-${Date.now()}-${Math.random()}`,
            timestamp: transformation.timestamp || new Date().toISOString(),
            type: 'transformation',
            transformationId: transformation.transformationId || transformation.id,
            user: transformation.user,
            status: transformation.status,
            sourceItem: transformation.sourceItem,
            targetItem: transformation.targetItem,
            conversionRatio: transformation.conversionRatio,
            metadata: transformation.metadata || {
                baseProduct: transformation.sourceItem?.baseProduct || 'TEST-PRODUCT',
                transformationType: `${transformation.sourceItem?.unit}_to_${transformation.targetItem?.unit}`
            }
        });
    }
}

// Import ReportManager
import ReportManager from '../../js/transformasi-barang/ReportManager.js';

describe('ReportManager Property-Based Tests', () => {
    let reportManager;
    let mockAuditLogger;

    beforeEach(() => {
        mockAuditLogger = new MockAuditLogger();
        reportManager = new ReportManager();
        reportManager.initialize({ auditLogger: mockAuditLogger });
    });

    /**
     * Property 19: Export Data Completeness
     * Feature: transformasi-barang, Property 19: Export Data Completeness
     * Validates: Requirements 4.4
     */
    describe('Property 19: Export Data Completeness', () => {
        test('For any transformation data export, all relevant transaction details should be included in the output', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    transformationId: fc.string({ minLength: 1, maxLength: 20 }),
                    user: fc.string({ minLength: 1, maxLength: 15 }),
                    status: fc.constantFrom('completed', 'failed', 'pending'),
                    sourceItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 15 }),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        unit: fc.constantFrom('pcs', 'dus', 'box', 'kg'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 15 })
                    }),
                    targetItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 15 }),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        unit: fc.constantFrom('pcs', 'dus', 'box', 'kg'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 15 })
                    }),
                    conversionRatio: fc.float({ min: Math.fround(0.1), max: Math.fround(100) })
                }), { minLength: 1, maxLength: 10 }),
                fc.constantFrom('csv', 'json', 'excel'),
                async (transformations, format) => {
                // Clear existing data first
                mockAuditLogger.transformationLogs = [];
                
                // Setup mock data
                transformations.forEach(t => mockAuditLogger.addMockTransformation(t));

                // Export data
                const exportResult = await reportManager.exportTransformationData({}, format);

                // Verify export result structure
                expect(exportResult).toHaveProperty('data');
                expect(exportResult).toHaveProperty('metadata');
                expect(exportResult.metadata).toHaveProperty('filename');
                expect(exportResult.metadata).toHaveProperty('mimeType');
                expect(exportResult.metadata).toHaveProperty('format', format);
                expect(exportResult.metadata).toHaveProperty('recordCount', transformations.length);

                // Verify data completeness based on format
                if (format === 'json') {
                    const exportData = JSON.parse(exportResult.data);
                    expect(exportData).toHaveProperty('exportInfo');
                    expect(exportData).toHaveProperty('transformations');
                    expect(exportData.transformations).toHaveLength(transformations.length);

                    // Check that all required fields are present in each transformation
                    exportData.transformations.forEach((exported) => {
                        // Find matching original by transformationId
                        const original = transformations.find(t => t.transformationId === exported.id) || transformations[0];
                        expect(exported).toHaveProperty('id');
                        expect(exported).toHaveProperty('timestamp');
                        expect(exported).toHaveProperty('user', original.user);
                        expect(exported).toHaveProperty('status', original.status);
                        expect(exported).toHaveProperty('sourceItem');
                        expect(exported).toHaveProperty('targetItem');
                        expect(exported).toHaveProperty('conversionRatio', original.conversionRatio);
                        
                        // Verify source item completeness
                        expect(exported.sourceItem).toHaveProperty('id', original.sourceItem.id);
                        expect(exported.sourceItem).toHaveProperty('name', original.sourceItem.name);
                        expect(exported.sourceItem).toHaveProperty('unit', original.sourceItem.unit);
                        expect(exported.sourceItem).toHaveProperty('quantity', original.sourceItem.quantity);
                        expect(exported.sourceItem).toHaveProperty('stockBefore', original.sourceItem.stockBefore);
                        expect(exported.sourceItem).toHaveProperty('stockAfter', original.sourceItem.stockAfter);
                        
                        // Verify target item completeness
                        expect(exported.targetItem).toHaveProperty('id', original.targetItem.id);
                        expect(exported.targetItem).toHaveProperty('name', original.targetItem.name);
                        expect(exported.targetItem).toHaveProperty('unit', original.targetItem.unit);
                        expect(exported.targetItem).toHaveProperty('quantity', original.targetItem.quantity);
                        expect(exported.targetItem).toHaveProperty('stockBefore', original.targetItem.stockBefore);
                        expect(exported.targetItem).toHaveProperty('stockAfter', original.targetItem.stockAfter);
                    });
                } else if (format === 'csv') {
                    const csvLines = exportResult.data.split('\n');
                    expect(csvLines.length).toBeGreaterThan(transformations.length); // Header + data rows
                    
                    // Check header contains all required fields
                    const header = csvLines[0];
                    const requiredFields = [
                        'ID Transformasi', 'Timestamp', 'User', 'Status',
                        'Produk Asal', 'Unit Asal', 'Jumlah Asal',
                        'Stok Asal Sebelum', 'Stok Asal Sesudah',
                        'Produk Target', 'Unit Target', 'Jumlah Target',
                        'Stok Target Sebelum', 'Stok Target Sesudah',
                        'Rasio Konversi', 'Base Product'
                    ];
                    
                    requiredFields.forEach(field => {
                        expect(header).toContain(field);
                    });
                    
                    // Check data rows (skip header)
                    const dataRows = csvLines.slice(1).filter(line => line.trim());
                    expect(dataRows.length).toBe(transformations.length);
                } else if (format === 'excel') {
                    // For Excel format (HTML), check basic structure
                    expect(exportResult.data).toContain('<table>');
                    expect(exportResult.data).toContain('<thead>');
                    expect(exportResult.data).toContain('<tbody>');
                    expect(exportResult.data).toContain('Laporan Transformasi Barang');
                }
                })
            );
        });
    });

    /**
     * Property 20: Search Filter Functionality
     * Feature: transformasi-barang, Property 20: Search Filter Functionality
     * Validates: Requirements 4.5
     */
    describe('Property 20: Search Filter Functionality', () => {
        test('For any transformation history search, filtering by date range, product, user, and type should work correctly', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    transformationId: fc.string({ minLength: 1, maxLength: 20 }),
                    timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                    user: fc.constantFrom('user1', 'user2', 'user3', 'admin'),
                    status: fc.constantFrom('completed', 'failed', 'pending'),
                    sourceItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 15 }),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        unit: fc.constantFrom('pcs', 'dus', 'box'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.constantFrom('PRODUCT-A', 'PRODUCT-B', 'PRODUCT-C')
                    }),
                    targetItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 15 }),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        unit: fc.constantFrom('pcs', 'dus', 'box'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.constantFrom('PRODUCT-A', 'PRODUCT-B', 'PRODUCT-C')
                    }),
                    conversionRatio: fc.float({ min: Math.fround(0.1), max: Math.fround(100) })
                }), { minLength: 5, maxLength: 20 }),
                async (transformations) => {
                // Clear existing data first
                mockAuditLogger.transformationLogs = [];
                
                // Setup mock data
                transformations.forEach(t => mockAuditLogger.addMockTransformation(t));

                // Test date range filtering
                const midDate = new Date('2024-06-15').toISOString();
                const dateFilterResult = await reportManager.searchTransformationHistory({
                    dateFrom: '2024-01-01T00:00:00.000Z',
                    dateTo: midDate
                });

                // All results should be within date range
                dateFilterResult.data.forEach(result => {
                    expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(new Date(midDate).getTime());
                });

                // Test user filtering
                const testUser = 'user1';
                const userFilterResult = await reportManager.searchTransformationHistory({
                    user: testUser
                });

                // All results should match user filter
                userFilterResult.data.forEach(result => {
                    expect(result.user.toLowerCase()).toContain(testUser.toLowerCase());
                });

                // Test product filtering
                const testProduct = 'PRODUCT-A';
                const productFilterResult = await reportManager.searchTransformationHistory({
                    product: testProduct
                });

                // All results should match product filter
                productFilterResult.data.forEach(result => {
                    const matchesProduct = 
                        result.metadata?.baseProduct?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.sourceItem.id?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.targetItem.id?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.sourceItem.name?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.targetItem.name?.toLowerCase().includes(testProduct.toLowerCase());
                    expect(matchesProduct).toBe(true);
                });

                // Test status filtering
                const testStatus = 'completed';
                const statusFilterResult = await reportManager.searchTransformationHistory({
                    status: testStatus
                });

                // All results should match status filter
                statusFilterResult.data.forEach(result => {
                    expect(result.status).toBe(testStatus);
                });

                // Test combined filtering
                const combinedFilterResult = await reportManager.searchTransformationHistory({
                    user: testUser,
                    status: testStatus,
                    product: testProduct
                });

                // All results should match all filters
                combinedFilterResult.data.forEach(result => {
                    expect(result.user.toLowerCase()).toContain(testUser.toLowerCase());
                    expect(result.status).toBe(testStatus);
                    const matchesProduct = 
                        result.metadata?.baseProduct?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.sourceItem.id?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.targetItem.id?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.sourceItem.name?.toLowerCase().includes(testProduct.toLowerCase()) ||
                        result.targetItem.name?.toLowerCase().includes(testProduct.toLowerCase());
                    expect(matchesProduct).toBe(true);
                });

                // Test pagination
                const paginationResult = await reportManager.searchTransformationHistory({
                    limit: 3,
                    offset: 1
                });

                expect(paginationResult.data.length).toBeLessThanOrEqual(3);
                expect(paginationResult.metadata.limit).toBe(3);
                expect(paginationResult.metadata.offset).toBe(1);
                expect(paginationResult.metadata).toHaveProperty('totalCount');
                expect(paginationResult.metadata).toHaveProperty('hasMore');
                })
            );
        });
    });

    /**
     * Property 18: Historical Data Completeness
     * Feature: transformasi-barang, Property 18: Historical Data Completeness
     * Validates: Requirements 4.3
     */
    describe('Property 18: Historical Data Completeness', () => {
        test('For any transformation record display, before and after stock levels should be shown for both units', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    transformationId: fc.string({ minLength: 1, maxLength: 20 }),
                    user: fc.string({ minLength: 1, maxLength: 15 }),
                    status: fc.constantFrom('completed', 'failed', 'pending'),
                    sourceItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 15 }),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        unit: fc.constantFrom('pcs', 'dus', 'box'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 15 })
                    }),
                    targetItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 15 }),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        unit: fc.constantFrom('pcs', 'dus', 'box'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 15 })
                    }),
                    conversionRatio: fc.float({ min: Math.fround(0.1), max: Math.fround(100) })
                }), { minLength: 1, maxLength: 10 }),
                async (transformations) => {
                // Clear existing data first
                mockAuditLogger.transformationLogs = [];
                
                // Setup mock data
                transformations.forEach(t => mockAuditLogger.addMockTransformation(t));

                // Get transformation history
                const historyResult = await reportManager.searchTransformationHistory({});

                // Verify each transformation record has complete stock information
                historyResult.data.forEach((record, index) => {
                    // Find the corresponding original transformation by ID
                    const original = transformations.find(t => 
                        (t.transformationId || t.id) === (record.transformationId || record.id)
                    ) || transformations[index];

                    // Verify source item stock information is complete
                    expect(record.sourceItem).toHaveProperty('stockBefore');
                    expect(record.sourceItem).toHaveProperty('stockAfter');
                    expect(typeof record.sourceItem.stockBefore).toBe('number');
                    expect(typeof record.sourceItem.stockAfter).toBe('number');
                    expect(record.sourceItem.stockBefore).toBe(original.sourceItem.stockBefore);
                    expect(record.sourceItem.stockAfter).toBe(original.sourceItem.stockAfter);

                    // Verify target item stock information is complete
                    expect(record.targetItem).toHaveProperty('stockBefore');
                    expect(record.targetItem).toHaveProperty('stockAfter');
                    expect(typeof record.targetItem.stockBefore).toBe('number');
                    expect(typeof record.targetItem.stockAfter).toBe('number');
                    expect(record.targetItem.stockBefore).toBe(original.targetItem.stockBefore);
                    expect(record.targetItem.stockAfter).toBe(original.targetItem.stockAfter);

                    // Verify enhanced metadata includes stock impact calculations
                    expect(record.enhancedMetadata).toHaveProperty('stockImpact');
                    expect(record.enhancedMetadata.stockImpact).toHaveProperty('sourceStockChange');
                    expect(record.enhancedMetadata.stockImpact).toHaveProperty('targetStockChange');
                    
                    // Verify stock change calculations are correct
                    const expectedSourceChange = record.sourceItem.stockAfter - record.sourceItem.stockBefore;
                    const expectedTargetChange = record.targetItem.stockAfter - record.targetItem.stockBefore;
                    expect(record.enhancedMetadata.stockImpact.sourceStockChange).toBe(expectedSourceChange);
                    expect(record.enhancedMetadata.stockImpact.targetStockChange).toBe(expectedTargetChange);

                    // Verify transformation summary includes both units
                    expect(record.enhancedMetadata).toHaveProperty('transformationSummary');
                    expect(record.enhancedMetadata.transformationSummary).toContain(record.sourceItem.unit);
                    expect(record.enhancedMetadata.transformationSummary).toContain(record.targetItem.unit);
                    expect(record.enhancedMetadata.transformationSummary).toContain('→');
                });

                // Test comprehensive report also includes complete stock information
                const comprehensiveReport = await reportManager.generateComprehensiveReport({});
                
                // Verify basic statistics include stock-related metrics
                expect(comprehensiveReport.basicStatistics).toHaveProperty('total');
                expect(comprehensiveReport.basicStatistics).toHaveProperty('successful');
                expect(comprehensiveReport.basicStatistics).toHaveProperty('failed');

                // Verify product analysis includes transformation counts
                expect(comprehensiveReport.productAnalysis).toHaveProperty('products');
                comprehensiveReport.productAnalysis.products.forEach(product => {
                    expect(product).toHaveProperty('totalTransformations');
                    expect(product).toHaveProperty('successfulTransformations');
                    expect(product).toHaveProperty('failedTransformations');
                    expect(typeof product.totalTransformations).toBe('number');
                    expect(typeof product.successfulTransformations).toBe('number');
                    expect(typeof product.failedTransformations).toBe('number');
                });

                // Verify user analysis includes complete activity data
                expect(comprehensiveReport.userAnalysis).toHaveProperty('users');
                comprehensiveReport.userAnalysis.users.forEach(user => {
                    expect(user).toHaveProperty('totalTransformations');
                    expect(user).toHaveProperty('successfulTransformations');
                    expect(user).toHaveProperty('failedTransformations');
                    expect(user).toHaveProperty('uniqueProducts');
                    expect(typeof user.totalTransformations).toBe('number');
                    expect(typeof user.successfulTransformations).toBe('number');
                    expect(typeof user.failedTransformations).toBe('number');
                    expect(typeof user.uniqueProducts).toBe('number');
                });
                })
            );
        });
    });

    // Additional unit tests for edge cases
    describe('ReportManager Edge Cases', () => {
        test('should handle empty transformation data gracefully', async () => {
            const exportResult = await expect(
                reportManager.exportTransformationData({}, 'csv')
            ).rejects.toThrow('Tidak ada data transformasi yang ditemukan');
        });

        test('should handle invalid export format', async () => {
            await expect(
                reportManager.exportTransformationData({}, 'invalid')
            ).rejects.toThrow('Format export tidak didukung');
        });

        test('should generate empty report for no data', async () => {
            const report = await reportManager.generateComprehensiveReport({});
            expect(report.basicStatistics.total).toBe(0);
            expect(report.productAnalysis.totalProducts).toBe(0);
            expect(report.userAnalysis.totalUsers).toBe(0);
        });

        test('should handle search with no results', async () => {
            const searchResult = await reportManager.searchTransformationHistory({
                searchTerm: 'nonexistent'
            });
            expect(searchResult.data).toHaveLength(0);
            expect(searchResult.metadata.totalCount).toBe(0);
        });
    });
});