/**
 * Property Test: Chronological History Display
 * Validates: Requirements 4.2
 * 
 * Property 17: Chronological History Display
 * Transformation history must be displayed in chronological order with proper filtering
 */

import fc from 'fast-check';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Property Test: Chronological History Display', () => {
    let auditLogger;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        
        auditLogger = new AuditLogger();
        auditLogger.initialize();
    });

    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('Property 17: Transformation history is displayed in chronological order', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 50 }),
                    user: fc.string({ minLength: 1, maxLength: 30 }),
                    status: fc.constantFrom('completed', 'failed', 'pending'),
                    sourceItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }),
                        unit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG'),
                        quantity: fc.integer({ min: 1, max: 1000 }),
                        stockBefore: fc.integer({ min: 0, max: 10000 }),
                        stockAfter: fc.integer({ min: 0, max: 10000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    targetItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }),
                        unit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG'),
                        quantity: fc.integer({ min: 1, max: 1000 }),
                        stockBefore: fc.integer({ min: 0, max: 10000 }),
                        stockAfter: fc.integer({ min: 0, max: 10000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    conversionRatio: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
                    delay: fc.integer({ min: 0, max: 100 }) // Milliseconds delay between logs
                }),
                { minLength: 2, maxLength: 20 }
            ),
            async (transformations) => {
                // Make IDs unique and ensure same base product
                const uniqueTransformations = transformations.map((t, index) => ({
                    ...t,
                    id: `${t.id}_${index}`,
                    targetItem: {
                        ...t.targetItem,
                        baseProduct: t.sourceItem.baseProduct
                    }
                }));

                // Log transformations with delays to ensure different timestamps
                const logTimestamps = [];
                for (let i = 0; i < uniqueTransformations.length; i++) {
                    const transformation = uniqueTransformations[i];
                    
                    // Add delay to ensure different timestamps
                    if (i > 0 && transformation.delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, transformation.delay));
                    }
                    
                    await auditLogger.logTransformation(transformation);
                    logTimestamps.push(Date.now());
                }

                // Get history without filters (default chronological order - newest first)
                const history = await auditLogger.getTransformationHistory();
                
                expect(history.data.length).toBe(uniqueTransformations.length);
                
                // Verify chronological order (newest first by default)
                for (let i = 1; i < history.data.length; i++) {
                    const currentTimestamp = new Date(history.data[i].timestamp).getTime();
                    const previousTimestamp = new Date(history.data[i-1].timestamp).getTime();
                    
                    expect(currentTimestamp).toBeLessThanOrEqual(previousTimestamp);
                }
                
                // Verify all transformations are present
                const historyIds = history.data.map(log => log.transformationId);
                const originalIds = uniqueTransformations.map(t => t.id);
                
                originalIds.forEach(id => {
                    expect(historyIds).toContain(id);
                });
                
                // Test ascending order
                const historyAsc = await auditLogger.getTransformationHistory({ sortOrder: 'asc' });
                
                for (let i = 1; i < historyAsc.data.length; i++) {
                    const currentTimestamp = new Date(historyAsc.data[i].timestamp).getTime();
                    const previousTimestamp = new Date(historyAsc.data[i-1].timestamp).getTime();
                    
                    expect(currentTimestamp).toBeGreaterThanOrEqual(previousTimestamp);
                }
            }
        ), { numRuns: 25 });
    });

    test('Property 17.1: Filtering maintains chronological order', () => {
        fc.assert(fc.property(
            fc.record({
                transformations: fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        user: fc.oneof(
                            fc.constant('user1'),
                            fc.constant('user2'),
                            fc.constant('user3')
                        ),
                        status: fc.constantFrom('completed', 'failed'),
                        sourceItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.oneof(
                                fc.constant('Product A'),
                                fc.constant('Product B'),
                                fc.constant('Product C')
                            ),
                            unit: fc.constantFrom('PCS', 'DUS'),
                            quantity: fc.integer({ min: 1, max: 100 }),
                            stockBefore: fc.integer({ min: 10, max: 1000 }),
                            stockAfter: fc.integer({ min: 0, max: 1000 }),
                            baseProduct: fc.oneof(
                                fc.constant('BASE_A'),
                                fc.constant('BASE_B'),
                                fc.constant('BASE_C')
                            )
                        }),
                        targetItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.oneof(
                                fc.constant('Product A'),
                                fc.constant('Product B'),
                                fc.constant('Product C')
                            ),
                            unit: fc.constantFrom('PCS', 'DUS'),
                            quantity: fc.integer({ min: 1, max: 100 }),
                            stockBefore: fc.integer({ min: 0, max: 1000 }),
                            stockAfter: fc.integer({ min: 0, max: 1000 }),
                            baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        conversionRatio: fc.float({ min: 1, max: 50, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 25 }
                ),
                filters: fc.record({
                    user: fc.option(fc.oneof(
                        fc.constant('user1'),
                        fc.constant('user2'),
                        fc.constant('user3')
                    )),
                    product: fc.option(fc.oneof(
                        fc.constant('Product A'),
                        fc.constant('Product B'),
                        fc.constant('Product C')
                    )),
                    status: fc.option(fc.constantFrom('completed', 'failed'))
                })
            }),
            async ({ transformations, filters }) => {
                // Make IDs unique and ensure same base product
                const uniqueTransformations = transformations.map((t, index) => ({
                    ...t,
                    id: `${t.id}_${index}`,
                    targetItem: {
                        ...t.targetItem,
                        baseProduct: t.sourceItem.baseProduct
                    }
                }));

                // Log transformations with small delays
                for (let i = 0; i < uniqueTransformations.length; i++) {
                    const transformation = uniqueTransformations[i];
                    
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                    
                    await auditLogger.logTransformation(transformation);
                }

                // Apply filters and get history
                const cleanFilters = {};
                if (filters.user) cleanFilters.user = filters.user;
                if (filters.product) cleanFilters.product = filters.product;
                if (filters.status) cleanFilters.status = filters.status;

                const filteredHistory = await auditLogger.getTransformationHistory(cleanFilters);
                
                // Verify chronological order is maintained after filtering
                if (filteredHistory.data.length > 1) {
                    for (let i = 1; i < filteredHistory.data.length; i++) {
                        const currentTimestamp = new Date(filteredHistory.data[i].timestamp).getTime();
                        const previousTimestamp = new Date(filteredHistory.data[i-1].timestamp).getTime();
                        
                        expect(currentTimestamp).toBeLessThanOrEqual(previousTimestamp);
                    }
                }
                
                // Verify filters are applied correctly
                filteredHistory.data.forEach(log => {
                    if (filters.user) {
                        expect(log.user).toBe(filters.user);
                    }
                    if (filters.status) {
                        expect(log.status).toBe(filters.status);
                    }
                    if (filters.product) {
                        const hasProductMatch = 
                            log.sourceItem.name.includes(filters.product) ||
                            log.targetItem.name.includes(filters.product) ||
                            log.metadata.baseProduct.includes(filters.product);
                        expect(hasProductMatch).toBe(true);
                    }
                });
                
                // Verify filtered results are subset of total
                const totalHistory = await auditLogger.getTransformationHistory();
                expect(filteredHistory.data.length).toBeLessThanOrEqual(totalHistory.data.length);
            }
        ), { numRuns: 20 });
    });

    test('Property 17.2: Date range filtering maintains chronological order', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 50 }),
                    user: fc.string({ minLength: 1, maxLength: 30 }),
                    status: fc.constantFrom('completed', 'failed'),
                    sourceItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }),
                        unit: fc.constantFrom('PCS', 'DUS'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 10, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    targetItem: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }),
                        unit: fc.constantFrom('PCS', 'DUS'),
                        quantity: fc.integer({ min: 1, max: 100 }),
                        stockBefore: fc.integer({ min: 0, max: 1000 }),
                        stockAfter: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    conversionRatio: fc.float({ min: 1, max: 50, noNaN: true }),
                    delay: fc.integer({ min: 50, max: 200 })
                }),
                { minLength: 3, maxLength: 15 }
            ),
            async (transformations) => {
                // Make IDs unique and ensure same base product
                const uniqueTransformations = transformations.map((t, index) => ({
                    ...t,
                    id: `${t.id}_${index}`,
                    targetItem: {
                        ...t.targetItem,
                        baseProduct: t.sourceItem.baseProduct
                    }
                }));

                // Log transformations with significant delays to create time gaps
                const loggedTimestamps = [];
                for (let i = 0; i < uniqueTransformations.length; i++) {
                    const transformation = uniqueTransformations[i];
                    
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, transformation.delay));
                    }
                    
                    await auditLogger.logTransformation(transformation);
                    loggedTimestamps.push(new Date().toISOString());
                }

                // Create date range filters
                const middleIndex = Math.floor(loggedTimestamps.length / 2);
                const dateFrom = loggedTimestamps[middleIndex];
                const dateTo = loggedTimestamps[loggedTimestamps.length - 1];

                // Apply date range filter
                const filteredHistory = await auditLogger.getTransformationHistory({
                    dateFrom: dateFrom,
                    dateTo: dateTo
                });

                // Verify chronological order is maintained
                if (filteredHistory.data.length > 1) {
                    for (let i = 1; i < filteredHistory.data.length; i++) {
                        const currentTimestamp = new Date(filteredHistory.data[i].timestamp).getTime();
                        const previousTimestamp = new Date(filteredHistory.data[i-1].timestamp).getTime();
                        
                        expect(currentTimestamp).toBeLessThanOrEqual(previousTimestamp);
                    }
                }

                // Verify all results are within date range
                const fromTime = new Date(dateFrom).getTime();
                const toTime = new Date(dateTo).getTime();
                
                filteredHistory.data.forEach(log => {
                    const logTime = new Date(log.timestamp).getTime();
                    expect(logTime).toBeGreaterThanOrEqual(fromTime);
                    expect(logTime).toBeLessThanOrEqual(toTime);
                });

                // Verify filtered results are subset of total
                const totalHistory = await auditLogger.getTransformationHistory();
                expect(filteredHistory.data.length).toBeLessThanOrEqual(totalHistory.data.length);
            }
        ), { numRuns: 15 });
    });

    test('Property 17.3: Pagination maintains chronological order', () => {
        fc.assert(fc.property(
            fc.record({
                transformations: fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 50 }),
                        user: fc.string({ minLength: 1, maxLength: 30 }),
                        status: fc.constantFrom('completed', 'failed'),
                        sourceItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            unit: fc.constantFrom('PCS', 'DUS'),
                            quantity: fc.integer({ min: 1, max: 100 }),
                            stockBefore: fc.integer({ min: 10, max: 1000 }),
                            stockAfter: fc.integer({ min: 0, max: 1000 }),
                            baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        targetItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 50 }),
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            unit: fc.constantFrom('PCS', 'DUS'),
                            quantity: fc.integer({ min: 1, max: 100 }),
                            stockBefore: fc.integer({ min: 0, max: 1000 }),
                            stockAfter: fc.integer({ min: 0, max: 1000 }),
                            baseProduct: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        conversionRatio: fc.float({ min: 1, max: 50, noNaN: true })
                    }),
                    { minLength: 10, maxLength: 30 }
                ),
                pageSize: fc.integer({ min: 2, max: 8 })
            }),
            async ({ transformations, pageSize }) => {
                // Make IDs unique and ensure same base product
                const uniqueTransformations = transformations.map((t, index) => ({
                    ...t,
                    id: `${t.id}_${index}`,
                    targetItem: {
                        ...t.targetItem,
                        baseProduct: t.sourceItem.baseProduct
                    }
                }));

                // Log all transformations with small delays
                for (let i = 0; i < uniqueTransformations.length; i++) {
                    const transformation = uniqueTransformations[i];
                    
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 20));
                    }
                    
                    await auditLogger.logTransformation(transformation);
                }

                // Test pagination
                const totalPages = Math.ceil(uniqueTransformations.length / pageSize);
                const allPaginatedResults = [];

                for (let page = 0; page < totalPages; page++) {
                    const offset = page * pageSize;
                    const paginatedHistory = await auditLogger.getTransformationHistory({
                        limit: pageSize,
                        offset: offset
                    });

                    // Verify chronological order within page
                    if (paginatedHistory.data.length > 1) {
                        for (let i = 1; i < paginatedHistory.data.length; i++) {
                            const currentTimestamp = new Date(paginatedHistory.data[i].timestamp).getTime();
                            const previousTimestamp = new Date(paginatedHistory.data[i-1].timestamp).getTime();
                            
                            expect(currentTimestamp).toBeLessThanOrEqual(previousTimestamp);
                        }
                    }

                    // Verify pagination metadata
                    expect(paginatedHistory.metadata.offset).toBe(offset);
                    expect(paginatedHistory.metadata.limit).toBe(pageSize);
                    expect(paginatedHistory.metadata.totalCount).toBe(uniqueTransformations.length);

                    allPaginatedResults.push(...paginatedHistory.data);
                }

                // Verify chronological order across all pages
                if (allPaginatedResults.length > 1) {
                    for (let i = 1; i < allPaginatedResults.length; i++) {
                        const currentTimestamp = new Date(allPaginatedResults[i].timestamp).getTime();
                        const previousTimestamp = new Date(allPaginatedResults[i-1].timestamp).getTime();
                        
                        expect(currentTimestamp).toBeLessThanOrEqual(previousTimestamp);
                    }
                }

                // Verify all transformations are included
                expect(allPaginatedResults.length).toBe(uniqueTransformations.length);
                
                const paginatedIds = allPaginatedResults.map(log => log.transformationId);
                const originalIds = uniqueTransformations.map(t => t.id);
                
                originalIds.forEach(id => {
                    expect(paginatedIds).toContain(id);
                });
            }
        ), { numRuns: 15 });
    });
});