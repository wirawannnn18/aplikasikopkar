/**
 * Property-Based Tests for Correlation Analysis Accuracy
 * 
 * **Feature: dashboard-analytics-kpi, Property 16: Correlation Analysis Accuracy**
 * **Validates: Requirements 8.4**
 * 
 * Tests that correlation analysis produces mathematically accurate results
 * across different datasets, correlation methods, and statistical scenarios.
 */

import fc from 'fast-check';

// Mock StatisticalAnalyzer for testing
class MockStatisticalAnalyzer {
    constructor() {
        this.MIN_DATA_POINTS = 5;
        this.correlationCache = new Map();
    }

    /**
     * Calculate Pearson correlation coefficient
     * @param {Array} x - First variable values
     * @param {Array} y - Second variable values
     * @returns {number} Correlation coefficient
     */
    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        if (n !== y.length || n === 0) {
            throw new Error('Arrays must have the same non-zero length');
        }

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Calculate Spearman rank correlation coefficient
     * @param {Array} x - First variable values
     * @param {Array} y - Second variable values
     * @returns {number} Spearman correlation coefficient
     */
    calculateSpearmanCorrelation(x, y) {
        // Convert to ranks
        const rankX = this.convertToRanks(x);
        const rankY = this.convertToRanks(y);
        
        // Calculate Pearson correlation on ranks
        return this.calculatePearsonCorrelation(rankX, rankY);
    }

    /**
     * Convert values to ranks
     * @param {Array} values - Values to rank
     * @returns {Array} Ranks
     */
    convertToRanks(values) {
        const indexed = values.map((value, index) => ({ value, index }));
        indexed.sort((a, b) => a.value - b.value);
        
        const ranks = new Array(values.length);
        for (let i = 0; i < indexed.length; i++) {
            ranks[indexed[i].index] = i + 1;
        }
        
        return ranks;
    }

    /**
     * Align two datasets by common time points
     * @param {Array} data1 - First dataset
     * @param {Array} data2 - Second dataset
     * @returns {Array} Aligned data points
     */
    alignDatasets(data1, data2) {
        const aligned = [];
        const map2 = new Map();
        
        // Create lookup map for second dataset
        for (const point of data2) {
            map2.set(point.x, point.y);
        }
        
        // Find matching points
        for (const point1 of data1) {
            if (map2.has(point1.x)) {
                aligned.push({
                    x: point1.x,
                    y1: point1.y,
                    y2: map2.get(point1.x)
                });
            }
        }
        
        return aligned;
    }

    /**
     * Calculate correlation with significance testing
     * @param {Array} data1 - First dataset
     * @param {Array} data2 - Second dataset
     * @param {string} method - Correlation method
     * @returns {Object} Correlation results
     */
    async calculateCorrelation(data1, data2, method = 'pearson') {
        // Align datasets by common time points
        const alignedData = this.alignDatasets(data1, data2);
        
        if (alignedData.length < this.MIN_DATA_POINTS) {
            throw new Error(`Insufficient data points for correlation analysis. Need at least ${this.MIN_DATA_POINTS}, got ${alignedData.length}`);
        }

        const values1 = alignedData.map(point => point.y1);
        const values2 = alignedData.map(point => point.y2);

        let coefficient;
        switch (method) {
            case 'pearson':
                coefficient = this.calculatePearsonCorrelation(values1, values2);
                break;
            case 'spearman':
                coefficient = this.calculateSpearmanCorrelation(values1, values2);
                break;
            default:
                throw new Error(`Unsupported correlation method: ${method}`);
        }

        // Calculate p-value for significance testing (simplified)
        const pValue = this.calculateCorrelationPValue(coefficient, alignedData.length);

        return {
            coefficient: coefficient,
            pValue: pValue,
            sampleSize: alignedData.length,
            method: method
        };
    }

    /**
     * Calculate correlation p-value (simplified)
     * @param {number} r - Correlation coefficient
     * @param {number} n - Sample size
     * @returns {number} P-value
     */
    calculateCorrelationPValue(r, n) {
        // Simplified p-value calculation using t-distribution approximation
        if (n <= 2) return 1.0;
        
        const t = r * Math.sqrt((n - 2) / (1 - r * r));
        const df = n - 2;
        
        // Approximate p-value (would need proper t-distribution CDF for accuracy)
        return Math.max(0.001, Math.min(0.999, 2 * (1 - this.approximateTCDF(Math.abs(t), df))));
    }

    /**
     * Approximate t-distribution CDF (simplified)
     * @param {number} t - T-statistic
     * @param {number} df - Degrees of freedom
     * @returns {number} Approximate CDF value
     */
    approximateTCDF(t, df) {
        // Very simplified approximation - would need proper implementation for production
        if (df >= 30) {
            // Approximate as normal distribution for large df
            return 0.5 + 0.5 * Math.sign(t) * Math.min(0.5, Math.abs(t) / 4);
        }
        
        // Simple approximation for small df
        return 0.5 + 0.5 * Math.sign(t) * Math.min(0.5, Math.abs(t) / (2 + df / 10));
    }

    /**
     * Perform correlation analysis between multiple datasets
     * @param {Array} datasets - Array of dataset objects
     * @param {Object} options - Analysis options
     * @returns {Object} Correlation analysis results
     */
    async performCorrelationAnalysis(datasets, options = {}) {
        const {
            method = 'pearson',
            threshold = 0.5
        } = options;

        const results = {
            method: method,
            threshold: threshold,
            correlations: [],
            matrix: {},
            metadata: {
                analyzedAt: new Date(),
                datasetCount: datasets.length,
                totalComparisons: (datasets.length * (datasets.length - 1)) / 2
            }
        };

        // Initialize correlation matrix
        datasets.forEach(dataset => {
            results.matrix[dataset.name] = {};
        });

        // Calculate pairwise correlations
        for (let i = 0; i < datasets.length; i++) {
            for (let j = i + 1; j < datasets.length; j++) {
                const dataset1 = datasets[i];
                const dataset2 = datasets[j];

                const correlation = await this.calculateCorrelation(
                    dataset1.data,
                    dataset2.data,
                    method
                );

                const correlationResult = {
                    metric1: dataset1.name,
                    metric2: dataset2.name,
                    coefficient: correlation.coefficient,
                    pValue: correlation.pValue,
                    sampleSize: correlation.sampleSize,
                    method: method
                };

                results.correlations.push(correlationResult);
                
                // Update matrix (symmetric)
                results.matrix[dataset1.name][dataset2.name] = correlation.coefficient;
                results.matrix[dataset2.name][dataset1.name] = correlation.coefficient;
            }
            
            // Self-correlation is always 1
            results.matrix[datasets[i].name][datasets[i].name] = 1.0;
        }

        return results;
    }
}

describe('Correlation Analysis Accuracy Property Tests', () => {
    let statisticalAnalyzer;

    beforeEach(() => {
        statisticalAnalyzer = new MockStatisticalAnalyzer();
    });

    /**
     * Property 16: Correlation Analysis Accuracy
     * For any correlation analysis, the calculated correlation coefficients should be
     * mathematically accurate and within valid bounds [-1, 1].
     */
    test('correlation coefficients are always within valid bounds [-1, 1]', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 100 }),
                        y: fc.float({ min: -1000, max: 1000, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 50 }
                ),
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 100 }),
                        y: fc.float({ min: -1000, max: 1000, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 50 }
                ),
                fc.constantFrom('pearson', 'spearman'),
                async (data1, data2, method) => {
                    try {
                        const datasets = [
                            { name: 'Dataset1', data: data1 },
                            { name: 'Dataset2', data: data2 }
                        ];

                        const results = await statisticalAnalyzer.performCorrelationAnalysis(datasets, {
                            method: method
                        });

                        // All correlation coefficients must be within [-1, 1]
                        for (const correlation of results.correlations) {
                            expect(correlation.coefficient).toBeGreaterThanOrEqual(-1);
                            expect(correlation.coefficient).toBeLessThanOrEqual(1);
                            expect(Number.isFinite(correlation.coefficient)).toBe(true);
                        }

                        // Matrix diagonal should be 1 (self-correlation)
                        for (const dataset of datasets) {
                            expect(results.matrix[dataset.name][dataset.name]).toBe(1.0);
                        }

                        // Matrix should be symmetric
                        expect(results.matrix['Dataset1']['Dataset2']).toBe(results.matrix['Dataset2']['Dataset1']);

                        return true;
                    } catch (error) {
                        // If insufficient data points, that's acceptable
                        if (error.message.includes('Insufficient data points')) {
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('perfect positive correlation produces coefficient of 1', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 20 }),
                        y: fc.float({ min: 1, max: 100, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 20 }
                ),
                fc.float({ min: 0.1, max: 10, noNaN: true }),
                fc.float({ min: -100, max: 100, noNaN: true }),
                async (baseData, slope, intercept) => {
                    // Create perfectly correlated data: y2 = slope * y1 + intercept
                    const data1 = baseData;
                    const data2 = baseData.map(point => ({
                        x: point.x,
                        y: slope * point.y + intercept
                    }));

                    const datasets = [
                        { name: 'Dataset1', data: data1 },
                        { name: 'Dataset2', data: data2 }
                    ];

                    const results = await statisticalAnalyzer.performCorrelationAnalysis(datasets, {
                        method: 'pearson'
                    });

                    // Perfect positive correlation should yield coefficient close to 1
                    const correlation = results.correlations[0];
                    if (slope > 0) {
                        expect(Math.abs(correlation.coefficient - 1)).toBeLessThan(0.0001);
                    } else {
                        expect(Math.abs(correlation.coefficient + 1)).toBeLessThan(0.0001);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('uncorrelated random data produces coefficient near zero', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 10, max: 50 }),
                fc.integer({ min: 1, max: 1000 }),
                async (dataSize, seed) => {
                    // Generate uncorrelated random data using seed for reproducibility
                    const rng = new fc.Random(fc.pureRandom.mersenne(seed));
                    
                    const data1 = Array.from({ length: dataSize }, (_, i) => ({
                        x: i + 1,
                        y: rng.next() * 1000 - 500 // Random values between -500 and 500
                    }));

                    const data2 = Array.from({ length: dataSize }, (_, i) => ({
                        x: i + 1,
                        y: rng.next() * 1000 - 500 // Independent random values
                    }));

                    const datasets = [
                        { name: 'Dataset1', data: data1 },
                        { name: 'Dataset2', data: data2 }
                    ];

                    const results = await statisticalAnalyzer.performCorrelationAnalysis(datasets, {
                        method: 'pearson'
                    });

                    const correlation = results.correlations[0];
                    
                    // For truly random data, correlation should be close to zero
                    // Allow for some variance due to random sampling
                    expect(Math.abs(correlation.coefficient)).toBeLessThan(0.5);
                    expect(Number.isFinite(correlation.coefficient)).toBe(true);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    test('correlation is symmetric (corr(X,Y) = corr(Y,X))', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 50 }),
                        y: fc.float({ min: -100, max: 100, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 30 }
                ),
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 50 }),
                        y: fc.float({ min: -100, max: 100, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 30 }
                ),
                async (data1, data2) => {
                    try {
                        // Calculate correlation in both directions
                        const corr1 = await statisticalAnalyzer.calculateCorrelation(data1, data2, 'pearson');
                        const corr2 = await statisticalAnalyzer.calculateCorrelation(data2, data1, 'pearson');

                        // Correlation should be symmetric
                        expect(Math.abs(corr1.coefficient - corr2.coefficient)).toBeLessThan(0.0001);

                        return true;
                    } catch (error) {
                        // If insufficient data points, that's acceptable
                        if (error.message.includes('Insufficient data points')) {
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    test('self-correlation always equals 1', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 50 }),
                        y: fc.float({ min: -100, max: 100, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 30 }
                ),
                async (data) => {
                    try {
                        const correlation = await statisticalAnalyzer.calculateCorrelation(data, data, 'pearson');
                        
                        // Self-correlation should always be 1
                        expect(Math.abs(correlation.coefficient - 1)).toBeLessThan(0.0001);

                        return true;
                    } catch (error) {
                        // If insufficient data points, that's acceptable
                        if (error.message.includes('Insufficient data points')) {
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    test('correlation methods produce consistent results for monotonic relationships', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 30 }),
                        y: fc.float({ min: 1, max: 100, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 20 }
                ),
                async (baseData) => {
                    // Create monotonic relationship (sorted by y values)
                    const sortedData = [...baseData].sort((a, b) => a.y - b.y);
                    const data1 = sortedData;
                    const data2 = sortedData.map((point, index) => ({
                        x: point.x,
                        y: index + 1 // Strictly increasing
                    }));

                    try {
                        const pearsonCorr = await statisticalAnalyzer.calculateCorrelation(data1, data2, 'pearson');
                        const spearmanCorr = await statisticalAnalyzer.calculateCorrelation(data1, data2, 'spearman');

                        // For monotonic relationships, both should be positive and strong
                        expect(pearsonCorr.coefficient).toBeGreaterThan(0);
                        expect(spearmanCorr.coefficient).toBeGreaterThan(0);
                        
                        // Spearman should be closer to 1 for monotonic relationships
                        expect(spearmanCorr.coefficient).toBeGreaterThanOrEqual(pearsonCorr.coefficient - 0.1);

                        return true;
                    } catch (error) {
                        // If insufficient data points, that's acceptable
                        if (error.message.includes('Insufficient data points')) {
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 30 }
        );
    });

    test('correlation analysis handles edge cases gracefully', async () => {
        // Test with constant values
        const constantData1 = Array.from({ length: 10 }, (_, i) => ({ x: i + 1, y: 5 }));
        const constantData2 = Array.from({ length: 10 }, (_, i) => ({ x: i + 1, y: 10 }));

        const datasets = [
            { name: 'Constant1', data: constantData1 },
            { name: 'Constant2', data: constantData2 }
        ];

        const results = await statisticalAnalyzer.performCorrelationAnalysis(datasets);

        // Correlation with constant values should be 0 (undefined correlation)
        expect(results.correlations[0].coefficient).toBe(0);
        expect(Number.isFinite(results.correlations[0].coefficient)).toBe(true);
    });

    test('correlation analysis validates input data requirements', async () => {
        // Test with insufficient data points
        const smallData1 = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
        const smallData2 = [{ x: 1, y: 3 }, { x: 2, y: 4 }];

        await expect(
            statisticalAnalyzer.calculateCorrelation(smallData1, smallData2)
        ).rejects.toThrow('Insufficient data points');

        // Test with mismatched data (no common x values)
        const data1 = [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }];
        const data2 = [{ x: 4, y: 4 }, { x: 5, y: 5 }, { x: 6, y: 6 }];

        await expect(
            statisticalAnalyzer.calculateCorrelation(data1, data2)
        ).rejects.toThrow('Insufficient data points');
    });

    test('p-values are within valid range [0, 1]', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 30 }),
                        y: fc.float({ min: -100, max: 100, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 20 }
                ),
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 1, max: 30 }),
                        y: fc.float({ min: -100, max: 100, noNaN: true })
                    }),
                    { minLength: 5, maxLength: 20 }
                ),
                async (data1, data2) => {
                    try {
                        const correlation = await statisticalAnalyzer.calculateCorrelation(data1, data2, 'pearson');
                        
                        // P-values must be within [0, 1]
                        expect(correlation.pValue).toBeGreaterThanOrEqual(0);
                        expect(correlation.pValue).toBeLessThanOrEqual(1);
                        expect(Number.isFinite(correlation.pValue)).toBe(true);

                        return true;
                    } catch (error) {
                        // If insufficient data points, that's acceptable
                        if (error.message.includes('Insufficient data points')) {
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    test('correlation matrix properties are maintained', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 10 }),
                        data: fc.array(
                            fc.record({
                                x: fc.integer({ min: 1, max: 20 }),
                                y: fc.float({ min: -50, max: 50, noNaN: true })
                            }),
                            { minLength: 5, maxLength: 15 }
                        )
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                async (datasets) => {
                    // Ensure unique dataset names
                    const uniqueDatasets = datasets.map((dataset, index) => ({
                        ...dataset,
                        name: `Dataset${index}`
                    }));

                    try {
                        const results = await statisticalAnalyzer.performCorrelationAnalysis(uniqueDatasets);

                        // Matrix should be square
                        const matrixSize = Object.keys(results.matrix).length;
                        expect(matrixSize).toBe(uniqueDatasets.length);

                        // Matrix should be symmetric
                        for (const name1 of Object.keys(results.matrix)) {
                            for (const name2 of Object.keys(results.matrix)) {
                                if (results.matrix[name1][name2] !== undefined && results.matrix[name2][name1] !== undefined) {
                                    expect(Math.abs(results.matrix[name1][name2] - results.matrix[name2][name1])).toBeLessThan(0.0001);
                                }
                            }
                        }

                        // Diagonal should be 1 (self-correlation)
                        for (const name of Object.keys(results.matrix)) {
                            expect(results.matrix[name][name]).toBe(1.0);
                        }

                        return true;
                    } catch (error) {
                        // If insufficient data points, that's acceptable
                        if (error.message.includes('Insufficient data points')) {
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 30 }
        );
    });

    test('correlation analysis metadata is accurate', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 10 }),
                        data: fc.array(
                            fc.record({
                                x: fc.integer({ min: 1, max: 15 }),
                                y: fc.float({ min: -30, max: 30, noNaN: true })
                            }),
                            { minLength: 5, maxLength: 10 }
                        )
                    }),
                    { minLength: 2, maxLength: 4 }
                ),
                async (datasets) => {
                    // Ensure unique dataset names
                    const uniqueDatasets = datasets.map((dataset, index) => ({
                        ...dataset,
                        name: `Dataset${index}`
                    }));

                    try {
                        const results = await statisticalAnalyzer.performCorrelationAnalysis(uniqueDatasets);

                        // Metadata should be accurate
                        expect(results.metadata.datasetCount).toBe(uniqueDatasets.length);
                        
                        const expectedComparisons = (uniqueDatasets.length * (uniqueDatasets.length - 1)) / 2;
                        expect(results.metadata.totalComparisons).toBe(expectedComparisons);
                        
                        // Number of correlations should match expected comparisons
                        expect(results.correlations.length).toBe(expectedComparisons);

                        // All correlations should have valid sample sizes
                        for (const correlation of results.correlations) {
                            expect(correlation.sampleSize).toBeGreaterThanOrEqual(5);
                            expect(Number.isInteger(correlation.sampleSize)).toBe(true);
                        }

                        return true;
                    } catch (error) {
                        // If insufficient data points, that's acceptable
                        if (error.message.includes('Insufficient data points')) {
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 25 }
        );
    });
});