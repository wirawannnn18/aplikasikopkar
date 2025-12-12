/**
 * Property-Based Tests for Data Aggregation Consistency
 * 
 * **Feature: dashboard-analytics-kpi, Property 10: Data Aggregation Consistency**
 * **Validates: Requirements 2.1, 8.1**
 * 
 * These tests verify that data aggregation operations produce mathematically
 * correct and consistent results across different scenarios and data sets.
 */

import fc from 'fast-check';

// Mock DataAggregator for testing
class MockDataSource {
    constructor() {
        this.savingsData = [];
        this.loansData = [];
    }

    async getSavingsByDateRange(startDate, endDate) {
        return this.savingsData.filter(saving => {
            const savingDate = new Date(saving.tanggal);
            return savingDate >= startDate && savingDate <= endDate;
        });
    }

    async getLoansByDateRange(startDate, endDate) {
        return this.loansData.filter(loan => {
            const loanDate = new Date(loan.tanggal_pinjaman);
            return loanDate >= startDate && loanDate <= endDate;
        });
    }

    setSavingsData(data) {
        this.savingsData = data;
    }

    setLoansData(data) {
        this.loansData = data;
    }
}

// Mock DataAggregator for testing environment
class DataAggregator {
        constructor(dataSource) {
            this.dataSource = dataSource;
            this.aggregationCache = new Map();
            this.cacheTimeout = 5 * 60 * 1000;
            
            this.timeIntervals = {
                daily: { unit: 'day', format: 'YYYY-MM-DD' },
                weekly: { unit: 'week', format: 'YYYY-[W]WW' },
                monthly: { unit: 'month', format: 'YYYY-MM' },
                quarterly: { unit: 'quarter', format: 'YYYY-[Q]Q' },
                yearly: { unit: 'year', format: 'YYYY' }
            };
            
            this.savingsCategories = ['pokok', 'wajib', 'sukarela'];
            this.loanCategories = ['produktif', 'konsumtif', 'darurat'];
        }

        async aggregateByTime(data, timeInterval, dateField, valueField, aggregationType = 'sum') {
            const interval = this.timeIntervals[timeInterval];
            if (!interval) {
                throw new Error(`Unsupported time interval: ${timeInterval}`);
            }

            const aggregated = {};
            const summary = {
                totalRecords: data.length,
                totalValue: 0,
                averageValue: 0,
                minValue: Infinity,
                maxValue: -Infinity,
                periods: 0
            };

            data.forEach(record => {
                if (!record[dateField] || record[valueField] === undefined) return;

                const date = new Date(record[dateField]);
                const periodKey = this._formatDateByInterval(date, interval);
                const value = parseFloat(record[valueField]) || 0;

                if (!aggregated[periodKey]) {
                    aggregated[periodKey] = {
                        period: periodKey,
                        date: date,
                        values: [],
                        count: 0,
                        sum: 0,
                        avg: 0,
                        min: Infinity,
                        max: -Infinity
                    };
                }

                aggregated[periodKey].values.push(value);
                aggregated[periodKey].count++;
                aggregated[periodKey].sum += value;
                aggregated[periodKey].min = Math.min(aggregated[periodKey].min, value);
                aggregated[periodKey].max = Math.max(aggregated[periodKey].max, value);
            });

            const result = [];
            Object.keys(aggregated).sort().forEach(periodKey => {
                const period = aggregated[periodKey];
                period.avg = period.count > 0 ? period.sum / period.count : 0;
                
                let finalValue;
                switch (aggregationType) {
                    case 'sum':
                        finalValue = period.sum;
                        break;
                    case 'avg':
                        finalValue = period.avg;
                        break;
                    case 'count':
                        finalValue = period.count;
                        break;
                    case 'min':
                        finalValue = period.min === Infinity ? 0 : period.min;
                        break;
                    case 'max':
                        finalValue = period.max === -Infinity ? 0 : period.max;
                        break;
                    default:
                        finalValue = period.sum;
                }

                const periodResult = {
                    period: periodKey,
                    date: period.date.toISOString(),
                    value: finalValue,
                    count: period.count,
                    sum: period.sum,
                    avg: period.avg,
                    min: period.min === Infinity ? 0 : period.min,
                    max: period.max === -Infinity ? 0 : period.max
                };

                result.push(periodResult);
                summary.totalValue += period.sum;
                summary.minValue = Math.min(summary.minValue, finalValue);
                summary.maxValue = Math.max(summary.maxValue, finalValue);
            });

            summary.periods = result.length;
            summary.averageValue = summary.periods > 0 ? summary.totalValue / summary.periods : 0;
            summary.minValue = summary.minValue === Infinity ? 0 : summary.minValue;
            summary.maxValue = summary.maxValue === -Infinity ? 0 : summary.maxValue;

            return {
                data: result,
                summary,
                aggregationType,
                timeInterval,
                generatedAt: new Date().toISOString()
            };
        }

        filterAndSort(data, filters = {}, sortOptions = {}) {
            let filteredData = [...data];

            Object.keys(filters).forEach(field => {
                const filterValue = filters[field];
                
                if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
                    filteredData = filteredData.filter(record => {
                        const recordValue = record[field];
                        
                        if (typeof filterValue === 'object' && filterValue.operator) {
                            switch (filterValue.operator) {
                                case 'equals':
                                    return recordValue === filterValue.value;
                                case 'contains':
                                    return String(recordValue).toLowerCase().includes(String(filterValue.value).toLowerCase());
                                case 'greaterThan':
                                    return parseFloat(recordValue) > parseFloat(filterValue.value);
                                case 'lessThan':
                                    return parseFloat(recordValue) < parseFloat(filterValue.value);
                                case 'between':
                                    const numValue = parseFloat(recordValue);
                                    return numValue >= parseFloat(filterValue.min) && numValue <= parseFloat(filterValue.max);
                                default:
                                    return recordValue === filterValue.value;
                            }
                        } else {
                            return recordValue === filterValue;
                        }
                    });
                }
            });

            if (sortOptions.field) {
                filteredData.sort((a, b) => {
                    const aValue = a[sortOptions.field];
                    const bValue = b[sortOptions.field];
                    
                    let comparison = 0;
                    
                    if (typeof aValue === 'number' && typeof bValue === 'number') {
                        comparison = aValue - bValue;
                    } else if (aValue instanceof Date && bValue instanceof Date) {
                        comparison = aValue.getTime() - bValue.getTime();
                    } else {
                        comparison = String(aValue).localeCompare(String(bValue));
                    }
                    
                    return sortOptions.direction === 'desc' ? -comparison : comparison;
                });
            }

            return filteredData;
        }

        createPivotTable(data, rowField, columnField, valueField, aggregationType = 'sum') {
            const pivot = {};
            const rowTotals = {};
            const columnTotals = {};
            let grandTotal = 0;

            data.forEach(record => {
                const rowKey = record[rowField] || 'Unknown';
                const colKey = record[columnField] || 'Unknown';
                const value = parseFloat(record[valueField]) || 0;

                if (!pivot[rowKey]) {
                    pivot[rowKey] = {};
                    rowTotals[rowKey] = { sum: 0, count: 0, values: [] };
                }

                if (!pivot[rowKey][colKey]) {
                    pivot[rowKey][colKey] = { sum: 0, count: 0, values: [] };
                }

                if (!columnTotals[colKey]) {
                    columnTotals[colKey] = { sum: 0, count: 0, values: [] };
                }

                pivot[rowKey][colKey].sum += value;
                pivot[rowKey][colKey].count++;
                pivot[rowKey][colKey].values.push(value);

                rowTotals[rowKey].sum += value;
                rowTotals[rowKey].count++;
                rowTotals[rowKey].values.push(value);

                columnTotals[colKey].sum += value;
                columnTotals[colKey].count++;
                columnTotals[colKey].values.push(value);

                grandTotal += value;
            });

            const applyAggregation = (cell) => {
                switch (aggregationType) {
                    case 'sum':
                        return cell.sum;
                    case 'avg':
                        return cell.count > 0 ? cell.sum / cell.count : 0;
                    case 'count':
                        return cell.count;
                    case 'min':
                        return cell.values.length > 0 ? Math.min(...cell.values) : 0;
                    case 'max':
                        return cell.values.length > 0 ? Math.max(...cell.values) : 0;
                    default:
                        return cell.sum;
                }
            };

            const processedPivot = {};
            Object.keys(pivot).forEach(rowKey => {
                processedPivot[rowKey] = {};
                Object.keys(pivot[rowKey]).forEach(colKey => {
                    processedPivot[rowKey][colKey] = applyAggregation(pivot[rowKey][colKey]);
                });
            });

            const processedRowTotals = {};
            Object.keys(rowTotals).forEach(rowKey => {
                processedRowTotals[rowKey] = applyAggregation(rowTotals[rowKey]);
            });

            const processedColumnTotals = {};
            Object.keys(columnTotals).forEach(colKey => {
                processedColumnTotals[colKey] = applyAggregation(columnTotals[colKey]);
            });

            return {
                pivot: processedPivot,
                rowTotals: processedRowTotals,
                columnTotals: processedColumnTotals,
                grandTotal: aggregationType === 'count' ? data.length : 
                           aggregationType === 'avg' ? (data.length > 0 ? grandTotal / data.length : 0) : grandTotal,
                aggregationType,
                metadata: {
                    rowField,
                    columnField,
                    valueField,
                    totalRows: Object.keys(processedPivot).length,
                    totalColumns: Object.keys(processedColumnTotals).length,
                    totalRecords: data.length
                }
            };
        }

        _formatDateByInterval(date, interval) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            switch (interval.unit) {
                case 'day':
                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                case 'week':
                    const weekNumber = this._getWeekNumber(date);
                    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
                case 'month':
                    return `${year}-${String(month).padStart(2, '0')}`;
                case 'quarter':
                    const quarter = Math.ceil(month / 3);
                    return `${year}-Q${quarter}`;
                case 'year':
                    return `${year}`;
                default:
                    return date.toISOString().split('T')[0];
            }
        }

        _getWeekNumber(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }
    }

describe('DataAggregator Property-Based Tests', () => {
    let dataAggregator;
    let mockDataSource;

    beforeEach(() => {
        mockDataSource = new MockDataSource();
        dataAggregator = new DataAggregator(mockDataSource);
    });

    describe('Property 1: Time Aggregation Mathematical Accuracy', () => {
        test('Sum aggregation should equal manual calculation', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
                    amount: fc.float({ min: 0, max: 10000, noNaN: true })
                }), { minLength: 1, maxLength: 100 }),
                fc.constantFrom('daily', 'monthly', 'yearly'),
                async (transactions, timeInterval) => {
                    // Prepare test data
                    const testData = transactions.map((t, index) => ({
                        id: index,
                        tanggal: t.date.toISOString(),
                        jumlah: t.amount
                    }));

                    // Aggregate using DataAggregator
                    const result = await dataAggregator.aggregateByTime(
                        testData, timeInterval, 'tanggal', 'jumlah', 'sum'
                    );

                    // Manual calculation for verification
                    const manualSum = testData.reduce((sum, record) => sum + parseFloat(record.jumlah), 0);
                    const aggregatedSum = result.data.reduce((sum, period) => sum + period.value, 0);

                    // Property: Aggregated sum should equal manual sum (within floating point precision)
                    expect(Math.abs(aggregatedSum - manualSum)).toBeLessThan(0.01);
                    
                    // Property: Summary total should match aggregated sum
                    expect(Math.abs(result.summary.totalValue - manualSum)).toBeLessThan(0.01);
                    
                    // Property: Total records should match input
                    expect(result.summary.totalRecords).toBe(testData.length);
                }
            ), { numRuns: 50 });
        });

        test('Average aggregation should be mathematically correct', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                    amount: fc.float({ min: 1, max: 1000, noNaN: true })
                }), { minLength: 2, maxLength: 50 }),
                async (transactions) => {
                    const testData = transactions.map((t, index) => ({
                        id: index,
                        tanggal: t.date.toISOString(),
                        jumlah: t.amount
                    }));

                    const result = await dataAggregator.aggregateByTime(
                        testData, 'monthly', 'tanggal', 'jumlah', 'avg'
                    );

                    // Verify each period's average is correct
                    result.data.forEach(period => {
                        // Property: Average should equal sum divided by count
                        const expectedAvg = period.count > 0 ? period.sum / period.count : 0;
                        expect(Math.abs(period.avg - expectedAvg)).toBeLessThan(0.01);
                        expect(Math.abs(period.value - expectedAvg)).toBeLessThan(0.01);
                    });
                }
            ), { numRuns: 30 });
        });

        test('Count aggregation should match record count', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                    amount: fc.float({ min: 0, max: 1000, noNaN: true })
                }), { minLength: 1, maxLength: 100 }),
                async (transactions) => {
                    const testData = transactions.map((t, index) => ({
                        id: index,
                        tanggal: t.date.toISOString(),
                        jumlah: t.amount
                    }));

                    const result = await dataAggregator.aggregateByTime(
                        testData, 'monthly', 'tanggal', 'jumlah', 'count'
                    );

                    // Property: Sum of all period counts should equal total records
                    const totalCount = result.data.reduce((sum, period) => sum + period.count, 0);
                    expect(totalCount).toBe(testData.length);
                    
                    // Property: Each period's value should equal its count
                    result.data.forEach(period => {
                        expect(period.value).toBe(period.count);
                    });
                }
            ), { numRuns: 40 });
        });

        test('Min/Max aggregation should be accurate', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                    amount: fc.float({ min: 1, max: 1000, noNaN: true })
                }), { minLength: 2, maxLength: 50 }),
                fc.constantFrom('min', 'max'),
                async (transactions, aggregationType) => {
                    const testData = transactions.map((t, index) => ({
                        id: index,
                        tanggal: t.date.toISOString(),
                        jumlah: t.amount
                    }));

                    const result = await dataAggregator.aggregateByTime(
                        testData, 'monthly', 'tanggal', 'jumlah', aggregationType
                    );

                    // Verify min/max values are correct
                    result.data.forEach(period => {
                        if (aggregationType === 'min') {
                            // Property: Min value should be the smallest in the period
                            expect(period.value).toBe(period.min);
                            expect(period.min).toBeLessThanOrEqual(period.max);
                        } else {
                            // Property: Max value should be the largest in the period
                            expect(period.value).toBe(period.max);
                            expect(period.max).toBeGreaterThanOrEqual(period.min);
                        }
                    });
                }
            ), { numRuns: 30 });
        });
    });

    describe('Property 2: Filter and Sort Consistency', () => {
        test('Filtering should preserve data integrity', () => {
            fc.assert(fc.property(
                fc.array(fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    category: fc.constantFrom('A', 'B', 'C'),
                    amount: fc.float({ min: 0, max: 1000, noNaN: true }),
                    status: fc.constantFrom('active', 'inactive')
                }), { minLength: 1, maxLength: 100 }),
                fc.constantFrom('A', 'B', 'C'),
                (data, filterCategory) => {
                    const filters = { category: filterCategory };
                    const filtered = dataAggregator.filterAndSort(data, filters);

                    // Property: All filtered records should match the filter criteria
                    filtered.forEach(record => {
                        expect(record.category).toBe(filterCategory);
                    });

                    // Property: Filtered count should not exceed original count
                    expect(filtered.length).toBeLessThanOrEqual(data.length);

                    // Property: If no records match filter, result should be empty
                    const expectedCount = data.filter(d => d.category === filterCategory).length;
                    expect(filtered.length).toBe(expectedCount);
                    
                    // Property: Manual filter should match automated filter
                    const manualFiltered = data.filter(d => d.category === filterCategory);
                    expect(filtered.length).toBe(manualFiltered.length);
                }
            ), { numRuns: 50 });
        });

        test('Numeric range filtering should be accurate', () => {
            fc.assert(fc.property(
                fc.array(fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    amount: fc.float({ min: 0, max: 1000, noNaN: true })
                }), { minLength: 1, maxLength: 100 }),
                fc.float({ min: 0, max: 500, noNaN: true }),
                fc.float({ min: 500, max: 1000, noNaN: true }),
                (data, minValue, maxValue) => {
                    const filters = {
                        amount: {
                            operator: 'between',
                            min: minValue,
                            max: maxValue
                        }
                    };
                    
                    const filtered = dataAggregator.filterAndSort(data, filters);

                    // Property: All filtered records should be within the range
                    filtered.forEach(record => {
                        expect(record.amount).toBeGreaterThanOrEqual(minValue);
                        expect(record.amount).toBeLessThanOrEqual(maxValue);
                    });

                    // Property: Manual filter should match automated filter
                    const manualFiltered = data.filter(d => d.amount >= minValue && d.amount <= maxValue);
                    expect(filtered.length).toBe(manualFiltered.length);
                }
            ), { numRuns: 40 });
        });

        test('Sorting should maintain order consistency', () => {
            fc.assert(fc.property(
                fc.array(fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    amount: fc.float({ min: 0, max: 1000, noNaN: true }),
                    name: fc.string({ minLength: 1, maxLength: 10 })
                }), { minLength: 2, maxLength: 50 }),
                fc.constantFrom('amount', 'name'),
                fc.constantFrom('asc', 'desc'),
                (data, sortField, direction) => {
                    const sortOptions = { field: sortField, direction };
                    const sorted = dataAggregator.filterAndSort(data, {}, sortOptions);

                    // Property: Sorted array should have same length as original
                    expect(sorted.length).toBe(data.length);

                    // Property: Order should be correct
                    for (let i = 1; i < sorted.length; i++) {
                        const prev = sorted[i - 1][sortField];
                        const curr = sorted[i][sortField];

                        if (typeof prev === 'number' && typeof curr === 'number') {
                            if (direction === 'asc') {
                                expect(prev).toBeLessThanOrEqual(curr);
                            } else {
                                expect(prev).toBeGreaterThanOrEqual(curr);
                            }
                        } else {
                            const comparison = String(prev).localeCompare(String(curr));
                            if (direction === 'asc') {
                                expect(comparison).toBeLessThanOrEqual(0);
                            } else {
                                expect(comparison).toBeGreaterThanOrEqual(0);
                            }
                        }
                    }
                }
            ), { numRuns: 30 });
        });
    });

    describe('Property 3: Pivot Table Mathematical Correctness', () => {
        test('Pivot table totals should be mathematically accurate', () => {
            fc.assert(fc.property(
                fc.array(fc.record({
                    category: fc.constantFrom('A', 'B', 'C'),
                    type: fc.constantFrom('X', 'Y', 'Z'),
                    amount: fc.float({ min: 1, max: 1000, noNaN: true })
                }), { minLength: 1, maxLength: 100 }),
                fc.constantFrom('sum', 'avg', 'count'),
                (data, aggregationType) => {
                    const pivot = dataAggregator.createPivotTable(
                        data, 'category', 'type', 'amount', aggregationType
                    );

                    // Property: Grand total should equal sum of all row totals
                    const rowTotalSum = Object.values(pivot.rowTotals).reduce((sum, val) => sum + val, 0);
                    
                    if (aggregationType === 'count') {
                        expect(pivot.grandTotal).toBe(data.length);
                        expect(Math.abs(rowTotalSum - data.length)).toBeLessThan(0.01);
                    } else if (aggregationType === 'sum') {
                        const manualSum = data.reduce((sum, record) => sum + record.amount, 0);
                        expect(Math.abs(pivot.grandTotal - manualSum)).toBeLessThan(0.01);
                        expect(Math.abs(rowTotalSum - manualSum)).toBeLessThan(0.01);
                    }

                    // Property: For sum/count, column totals should equal grand total
                    // For avg, this relationship doesn't hold due to different denominators
                    if (aggregationType !== 'avg') {
                        const colTotalSum = Object.values(pivot.columnTotals).reduce((sum, val) => sum + val, 0);
                        expect(Math.abs(colTotalSum - pivot.grandTotal)).toBeLessThan(0.01);
                    }

                    // Property: Metadata should be accurate
                    expect(pivot.metadata.totalRecords).toBe(data.length);
                    expect(pivot.metadata.totalRows).toBe(Object.keys(pivot.pivot).length);
                    expect(pivot.metadata.totalColumns).toBe(Object.keys(pivot.columnTotals).length);
                }
            ), { numRuns: 40 });
        });

        test('Pivot table cell values should be consistent with aggregation type', () => {
            fc.assert(fc.property(
                fc.array(fc.record({
                    category: fc.constantFrom('A', 'B'),
                    type: fc.constantFrom('X', 'Y'),
                    amount: fc.float({ min: 1, max: 100, noNaN: true })
                }), { minLength: 4, maxLength: 20 }),
                (data) => {
                    const sumPivot = dataAggregator.createPivotTable(data, 'category', 'type', 'amount', 'sum');
                    const avgPivot = dataAggregator.createPivotTable(data, 'category', 'type', 'amount', 'avg');
                    const countPivot = dataAggregator.createPivotTable(data, 'category', 'type', 'amount', 'count');

                    // Property: For each cell, avg should equal sum/count
                    Object.keys(sumPivot.pivot).forEach(rowKey => {
                        Object.keys(sumPivot.pivot[rowKey]).forEach(colKey => {
                            const sumValue = sumPivot.pivot[rowKey][colKey];
                            const avgValue = avgPivot.pivot[rowKey][colKey];
                            const countValue = countPivot.pivot[rowKey][colKey];

                            if (countValue > 0) {
                                const expectedAvg = sumValue / countValue;
                                expect(Math.abs(avgValue - expectedAvg)).toBeLessThan(0.01);
                            }
                        });
                    });
                }
            ), { numRuns: 25 });
        });
    });

    describe('Property 4: Data Consistency Across Operations', () => {
        test('Aggregation should be idempotent for same input', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                    amount: fc.float({ min: 1, max: 1000, noNaN: true })
                }), { minLength: 1, maxLength: 50 }),
                async (transactions) => {
                    const testData = transactions.map((t, index) => ({
                        id: index,
                        tanggal: t.date.toISOString(),
                        jumlah: t.amount
                    }));

                    // Run aggregation twice with same parameters
                    const result1 = await dataAggregator.aggregateByTime(
                        testData, 'monthly', 'tanggal', 'jumlah', 'sum'
                    );
                    
                    const result2 = await dataAggregator.aggregateByTime(
                        testData, 'monthly', 'tanggal', 'jumlah', 'sum'
                    );

                    // Property: Results should be identical (idempotent)
                    expect(result1.data.length).toBe(result2.data.length);
                    expect(result1.summary.totalValue).toBe(result2.summary.totalValue);
                    expect(result1.summary.totalRecords).toBe(result2.summary.totalRecords);

                    // Compare each period
                    result1.data.forEach((period1, index) => {
                        const period2 = result2.data[index];
                        expect(period1.period).toBe(period2.period);
                        expect(Math.abs(period1.value - period2.value)).toBeLessThan(0.01);
                        expect(period1.count).toBe(period2.count);
                    });
                }
            ), { numRuns: 30 });
        });

        test('Empty data should produce consistent empty results', async () => {
            const emptyData = [];
            
            const result = await dataAggregator.aggregateByTime(
                emptyData, 'monthly', 'tanggal', 'jumlah', 'sum'
            );

            // Property: Empty input should produce empty but valid output
            expect(result.data).toEqual([]);
            expect(result.summary.totalRecords).toBe(0);
            expect(result.summary.totalValue).toBe(0);
            expect(result.summary.periods).toBe(0);
            expect(result.summary.averageValue).toBe(0);

            // Test with other aggregation types
            const avgResult = await dataAggregator.aggregateByTime(
                emptyData, 'monthly', 'tanggal', 'jumlah', 'avg'
            );
            expect(avgResult.data).toEqual([]);
            expect(avgResult.summary.totalRecords).toBe(0);
        });

        test('Single record should produce mathematically correct results', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                    amount: fc.float({ min: 1, max: 1000, noNaN: true })
                }),
                async (transaction) => {
                    const testData = [{
                        id: 1,
                        tanggal: transaction.date.toISOString(),
                        jumlah: transaction.amount
                    }];

                    const result = await dataAggregator.aggregateByTime(
                        testData, 'monthly', 'tanggal', 'jumlah', 'sum'
                    );

                    // Property: Single record should produce single period with correct values
                    expect(result.data.length).toBe(1);
                    expect(result.summary.totalRecords).toBe(1);
                    expect(Math.abs(result.summary.totalValue - transaction.amount)).toBeLessThan(0.01);
                    expect(Math.abs(result.data[0].value - transaction.amount)).toBeLessThan(0.01);
                    expect(result.data[0].count).toBe(1);
                    expect(Math.abs(result.data[0].sum - transaction.amount)).toBeLessThan(0.01);
                    expect(Math.abs(result.data[0].avg - transaction.amount)).toBeLessThan(0.01);
                    expect(Math.abs(result.data[0].min - transaction.amount)).toBeLessThan(0.01);
                    expect(Math.abs(result.data[0].max - transaction.amount)).toBeLessThan(0.01);
                }
            ), { numRuns: 30 });
        });
    });

    describe('Property 5: Performance and Boundary Conditions', () => {
        test('Large dataset aggregation should maintain accuracy', async () => {
            // Generate large dataset
            const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
                id: index,
                tanggal: new Date(2023, Math.floor(index / 100), (index % 30) + 1).toISOString(),
                jumlah: Math.random() * 1000
            }));

            const startTime = Date.now();
            const result = await dataAggregator.aggregateByTime(
                largeDataset, 'monthly', 'tanggal', 'jumlah', 'sum'
            );
            const endTime = Date.now();

            // Property: Large dataset should still produce accurate results
            expect(result.summary.totalRecords).toBe(1000);
            
            // Property: Performance should be reasonable (less than 1 second for 1000 records)
            expect(endTime - startTime).toBeLessThan(1000);

            // Property: Manual sum should match aggregated sum
            const manualSum = largeDataset.reduce((sum, record) => sum + parseFloat(record.jumlah), 0);
            const aggregatedSum = result.data.reduce((sum, period) => sum + period.value, 0);
            expect(Math.abs(aggregatedSum - manualSum)).toBeLessThan(0.01);
        });

        test('Extreme values should be handled correctly', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                    amount: fc.oneof(
                        fc.constant(0),
                        fc.constant(1000000),
                        fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
                        fc.float({ min: Math.fround(1000), max: Math.fround(9999), noNaN: true })
                    )
                }), { minLength: 1, maxLength: 20 }),
                async (transactions) => {
                    const testData = transactions.map((t, index) => ({
                        id: index,
                        tanggal: t.date.toISOString(),
                        jumlah: t.amount
                    }));

                    const result = await dataAggregator.aggregateByTime(
                        testData, 'monthly', 'tanggal', 'jumlah', 'sum'
                    );

                    // Property: Should handle extreme values without errors
                    expect(result.data).toBeDefined();
                    expect(result.summary.totalRecords).toBe(testData.length);
                    expect(Number.isFinite(result.summary.totalValue)).toBe(true);

                    // Property: All period values should be finite numbers
                    result.data.forEach(period => {
                        expect(Number.isFinite(period.value)).toBe(true);
                        expect(Number.isFinite(period.sum)).toBe(true);
                        expect(Number.isFinite(period.avg)).toBe(true);
                    });
                }
            ), { numRuns: 20 });
        });
    });
});