/**
 * Dashboard Analytics & KPI - Statistical Calculation Correctness Property Test
 * 
 * Property-based test for statistical analysis and forecasting accuracy
 * **Feature: dashboard-analytics-kpi, Property 5: Statistical Calculation Correctness**
 * **Validates: Requirements 8.4**
 */

import fc from 'fast-check';

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock btoa for hashing
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

describe('Statistical Calculation Correctness Property Tests', () => {
    let AnalyticsEngine;

    beforeAll(async () => {
        // Import the AnalyticsEngine
        const analyticsModule = await import('../../js/dashboard/AnalyticsEngine.js');
        AnalyticsEngine = analyticsModule.AnalyticsEngine;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.performance.now.mockImplementation(() => Date.now());
    });

    /**
     * Property 5: Statistical Calculation Correctness
     * For any valid dataset, statistical calculations should be mathematically accurate
     */
    test('Property 5: Linear trend calculation should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.array(fc.float({ min: 0, max: 1000000 }), { minLength: 3, maxLength: 100 }),
            async (data) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const trend = engine.calculateLinearTrend(data);
                    
                    // Property 1: Trend should have valid structure
                    const hasValidStructure = 
                        typeof trend.slope === 'number' &&
                        typeof trend.intercept === 'number' &&
                        typeof trend.rSquared === 'number' &&
                        !isNaN(trend.slope) && !isNaN(trend.intercept) && !isNaN(trend.rSquared);
                    
                    // Property 2: R-squared should be between 0 and 1
                    const rSquaredValid = trend.rSquared >= 0 && trend.rSquared <= 1;
                    
                    // Property 3: For constant data, slope should be 0
                    const allSame = data.every(val => val === data[0]);
                    const constantSlopeCorrect = !allSame || Math.abs(trend.slope) < 0.001;
                    
                    engine.destroy();
                    
                    return hasValidStructure && rSquaredValid && constantSlopeCorrect;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 100,
            timeout: 8000
        });
    });
    /**
     * Property 6: Correlation Calculation Accuracy
     * For any two valid datasets, correlation should be mathematically correct
     */
    test('Property 6: Correlation calculation should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 3, maxLength: 50 }),
            fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 3, maxLength: 50 }),
            async (dataX, dataY) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    // Ensure same length
                    const minLength = Math.min(dataX.length, dataY.length);
                    const x = dataX.slice(0, minLength);
                    const y = dataY.slice(0, minLength);
                    
                    const correlation = engine.calculateCorrelation(x, y);
                    
                    // Property 1: Correlation should be between -1 and 1
                    const correlationInRange = correlation >= -1 && correlation <= 1;
                    
                    // Property 2: Correlation should be a valid number
                    const correlationValid = !isNaN(correlation) && isFinite(correlation);
                    
                    // Property 3: Perfect positive correlation
                    const perfectCorrelation = engine.calculateCorrelation(x, x);
                    const perfectCorrelationCorrect = Math.abs(perfectCorrelation - 1) < 0.001;
                    
                    // Property 4: Constant data should have correlation 0 (or undefined)
                    const constantX = Array(x.length).fill(x[0]);
                    const constantCorrelation = engine.calculateCorrelation(constantX, y);
                    const constantCorrelationCorrect = Math.abs(constantCorrelation) < 0.001 || constantCorrelation === 0;
                    
                    engine.destroy();
                    
                    return correlationInRange && correlationValid && perfectCorrelationCorrect && constantCorrelationCorrect;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 75,
            timeout: 8000
        });
    });

    /**
     * Property 7: Anomaly Detection Consistency
     * For any dataset, anomaly detection should be consistent and reasonable
     */
    test('Property 7: Anomaly detection should be consistent and reasonable', () => {
        fc.assert(fc.property(
            fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 10, maxLength: 100 }),
            fc.float({ min: 1.5, max: 4.0 }), // threshold
            async (data, threshold) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const anomalies = engine.detectAnomalies(data, threshold);
                    
                    // Property 1: Anomalies should be an array
                    const isArray = Array.isArray(anomalies);
                    
                    // Property 2: Each anomaly should have valid structure
                    const validStructure = anomalies.every(anomaly => 
                        typeof anomaly.index === 'number' &&
                        typeof anomaly.value === 'number' &&
                        typeof anomaly.zScore === 'number' &&
                        anomaly.index >= 0 && anomaly.index < data.length &&
                        anomaly.zScore >= threshold
                    );
                    
                    // Property 3: Anomaly count should be reasonable (not more than 50% of data)
                    const reasonableCount = anomalies.length <= data.length * 0.5;
                    
                    // Property 4: For uniform data, there should be no anomalies
                    const uniformData = Array(20).fill(100);
                    const uniformAnomalies = engine.detectAnomalies(uniformData, threshold);
                    const uniformCorrect = uniformAnomalies.length === 0;
                    
                    engine.destroy();
                    
                    return isArray && validStructure && reasonableCount && uniformCorrect;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 60,
            timeout: 8000
        });
    });

    /**
     * Property 8: Forecast Generation Accuracy
     * For any historical data, forecasts should be reasonable and well-structured
     */
    test('Property 8: Forecast generation should be accurate and reasonable', () => {
        fc.assert(fc.property(
            fc.array(fc.float({ min: 10, max: 10000 }), { minLength: 5, maxLength: 50 }),
            fc.integer({ min: 1, max: 10 }), // periods
            async (historicalData, periods) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const forecast = engine.generateForecast(historicalData, periods);
                    
                    // Property 1: Forecast should be an array with correct length
                    const correctLength = Array.isArray(forecast) && forecast.length === periods;
                    
                    // Property 2: Each forecast point should have valid structure
                    const validStructure = forecast.every(point => 
                        typeof point.period === 'number' &&
                        typeof point.value === 'number' &&
                        typeof point.confidence === 'number' &&
                        point.period > 0 &&
                        point.value >= 0 &&
                        point.confidence >= 0 && point.confidence <= 1
                    );
                    
                    // Property 3: Periods should be sequential
                    const sequentialPeriods = forecast.every((point, index) => point.period === index + 1);
                    
                    // Property 4: For increasing data, forecast should generally increase
                    const isIncreasing = historicalData.every((val, i) => i === 0 || val >= historicalData[i - 1]);
                    const forecastTrend = isIncreasing ? 
                        forecast.length <= 1 || forecast[forecast.length - 1].value >= forecast[0].value :
                        true; // Don't check trend for non-increasing data
                    
                    engine.destroy();
                    
                    return correctLength && validStructure && sequentialPeriods && forecastTrend;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 50,
            timeout: 8000
        });
    });

    /**
     * Property 9: Statistical Measures Accuracy
     * For any dataset, basic statistical measures should be mathematically correct
     */
    test('Property 9: Statistical measures should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.array(fc.float({ min: 1, max: 1000 }), { minLength: 5, maxLength: 100 }),
            async (data) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    // Test median calculation
                    const sortedData = [...data].sort((a, b) => a - b);
                    const median = engine.calculateMedian(sortedData);
                    
                    // Property 1: Median should be within data range
                    const medianInRange = median >= Math.min(...data) && median <= Math.max(...data);
                    
                    // Test percentile calculation
                    const p50 = engine.calculatePercentile(sortedData, 50);
                    const p0 = engine.calculatePercentile(sortedData, 0);
                    const p100 = engine.calculatePercentile(sortedData, 100);
                    
                    // Property 2: Percentiles should be ordered correctly
                    const percentilesOrdered = p0 <= p50 && p50 <= p100;
                    
                    // Property 3: 0th percentile should be minimum, 100th should be maximum
                    const extremesCorrect = 
                        Math.abs(p0 - Math.min(...data)) < 0.001 &&
                        Math.abs(p100 - Math.max(...data)) < 0.001;
                    
                    // Test standard deviation
                    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
                    const stdDev = engine.calculateStandardDeviation(data, mean);
                    
                    // Property 4: Standard deviation should be non-negative
                    const stdDevValid = stdDev >= 0 && !isNaN(stdDev);
                    
                    // Property 5: For constant data, std dev should be 0
                    const constantData = Array(10).fill(data[0]);
                    const constantStdDev = engine.calculateStandardDeviation(constantData, data[0]);
                    const constantStdDevCorrect = Math.abs(constantStdDev) < 0.001;
                    
                    engine.destroy();
                    
                    return medianInRange && percentilesOrdered && extremesCorrect && 
                           stdDevValid && constantStdDevCorrect;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 80,
            timeout: 8000
        });
    });

    /**
     * Property 10: Financial Trends Calculation Accuracy
     * For any historical financial data, trend analysis should be comprehensive and accurate
     */
    test('Property 10: Financial trends calculation should be comprehensive', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
                    totalRevenue: fc.float({ min: 100000, max: 10000000 }),
                    totalAssets: fc.float({ min: 500000, max: 50000000 }),
                    memberCount: fc.integer({ min: 100, max: 10000 })
                }),
                { minLength: 6, maxLength: 24 }
            ),
            async (historicalData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const trends = await engine.calculateFinancialTrends(historicalData);
                    
                    // Property 1: Result should have complete structure
                    const hasCompleteStructure = 
                        trends.trends && trends.correlations && trends.anomalies && 
                        trends.forecasts && trends.calculatedAt && trends.dataPoints;
                    
                    // Property 2: All trend directions should be valid
                    const validDirections = ['increasing', 'decreasing', 'stable'];
                    const directionsValid = 
                        validDirections.includes(trends.trends.revenue.direction) &&
                        validDirections.includes(trends.trends.assets.direction) &&
                        validDirections.includes(trends.trends.members.direction);
                    
                    // Property 3: R-squared values should be between 0 and 1
                    const rSquaredValid = 
                        trends.trends.revenue.rSquared >= 0 && trends.trends.revenue.rSquared <= 1 &&
                        trends.trends.assets.rSquared >= 0 && trends.trends.assets.rSquared <= 1 &&
                        trends.trends.members.rSquared >= 0 && trends.trends.members.rSquared <= 1;
                    
                    // Property 4: Correlations should be between -1 and 1
                    const correlationsValid = 
                        trends.correlations.revenueAssets >= -1 && trends.correlations.revenueAssets <= 1 &&
                        trends.correlations.revenueMembers >= -1 && trends.correlations.revenueMembers <= 1;
                    
                    // Property 5: Forecasts should have reasonable structure
                    const forecastsValid = 
                        Array.isArray(trends.forecasts.revenue) &&
                        Array.isArray(trends.forecasts.assets) &&
                        Array.isArray(trends.forecasts.members) &&
                        trends.forecasts.revenue.every(f => f.value >= 0 && f.confidence >= 0);
                    
                    // Property 6: Data points should match input length
                    const dataPointsMatch = trends.dataPoints === historicalData.length;
                    
                    engine.destroy();
                    
                    return hasCompleteStructure && directionsValid && rSquaredValid && 
                           correlationsValid && forecastsValid && dataPointsMatch;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 40,
            timeout: 10000
        });
    });

    /**
     * Property 11: Transaction Trends Analysis Accuracy
     * For any transaction history, trend analysis should be accurate and comprehensive
     */
    test('Property 11: Transaction trends analysis should be accurate', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    date: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }),
                    amount: fc.float({ min: 1000, max: 1000000 }),
                    timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') })
                }),
                { minLength: 50, maxLength: 500 }
            ),
            async (transactionHistory) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const trends = await engine.calculateTransactionTrends(transactionHistory);
                    
                    // Property 1: Result should have complete structure
                    const hasCompleteStructure = 
                        trends.trends && trends.patterns && trends.anomalies && 
                        trends.statistics && trends.calculatedAt;
                    
                    // Property 2: Trend directions should be valid
                    const validDirections = ['increasing', 'decreasing', 'stable'];
                    const directionsValid = 
                        validDirections.includes(trends.trends.volume.direction) &&
                        validDirections.includes(trends.trends.value.direction);
                    
                    // Property 3: Statistics should be reasonable
                    const statisticsValid = 
                        trends.statistics.totalTransactions === transactionHistory.length &&
                        trends.statistics.averageMonthlyVolume >= 0 &&
                        trends.statistics.averageMonthlyValue >= 0 &&
                        trends.statistics.monthsAnalyzed >= 0;
                    
                    // Property 4: Peak hours should be valid (0-23)
                    const peakHoursValid = trends.patterns.peakHours.every(peak => 
                        peak.hour >= 0 && peak.hour <= 23 &&
                        peak.transactionCount >= 0 &&
                        peak.percentage >= 0 && peak.percentage <= 100
                    );
                    
                    // Property 5: Peak days should have valid structure
                    const peakDaysValid = trends.patterns.peakDays.every(day => 
                        typeof day.dayName === 'string' &&
                        day.averageTransactions >= 0 &&
                        day.totalDays >= 0
                    );
                    
                    engine.destroy();
                    
                    return hasCompleteStructure && directionsValid && statisticsValid && 
                           peakHoursValid && peakDaysValid;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 30,
            timeout: 12000
        });
    });
});

/**
 * Integration tests for statistical calculation correctness
 */
describe('Statistical Calculation Integration Tests', () => {
    let AnalyticsEngine;

    beforeAll(async () => {
        const analyticsModule = await import('../../js/dashboard/AnalyticsEngine.js');
        AnalyticsEngine = analyticsModule.AnalyticsEngine;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.performance.now.mockImplementation(() => Date.now());
    });

    test('Linear trend calculation with known data should be accurate', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Test with known linear data: y = 2x + 1
        const knownData = [1, 3, 5, 7, 9, 11]; // y = 2x + 1 for x = 0,1,2,3,4,5
        const trend = engine.calculateLinearTrend(knownData);
        
        // Should have slope ≈ 2 and intercept ≈ 1
        expect(trend.slope).toBeCloseTo(2, 1);
        expect(trend.intercept).toBeCloseTo(1, 1);
        expect(trend.rSquared).toBeCloseTo(1, 2); // Perfect fit
        
        engine.destroy();
    });

    test('Correlation calculation with known data should be accurate', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Perfect positive correlation
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10]; // y = 2x
        const correlation = engine.calculateCorrelation(x, y);
        
        expect(correlation).toBeCloseTo(1, 2);
        
        // Perfect negative correlation
        const yNeg = [10, 8, 6, 4, 2]; // y = -2x + 12
        const negCorrelation = engine.calculateCorrelation(x, yNeg);
        
        expect(negCorrelation).toBeCloseTo(-1, 2);
        
        engine.destroy();
    });

    test('Anomaly detection should identify clear outliers', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Data with clear outliers
        const dataWithOutliers = [10, 12, 11, 13, 10, 100, 9, 11, 12, 10]; // 100 is clear outlier
        const anomalies = engine.detectAnomalies(dataWithOutliers, 2.0);
        
        expect(anomalies.length).toBeGreaterThan(0);
        expect(anomalies[0].value).toBe(100);
        expect(anomalies[0].zScore).toBeGreaterThan(2.0);
        
        engine.destroy();
    });

    test('Forecast generation should produce reasonable predictions', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Increasing trend data
        const trendData = [10, 15, 20, 25, 30, 35];
        const forecast = engine.generateForecast(trendData, 3);
        
        expect(forecast).toHaveLength(3);
        expect(forecast[0].period).toBe(1);
        expect(forecast[1].period).toBe(2);
        expect(forecast[2].period).toBe(3);
        
        // Values should generally increase for increasing trend
        expect(forecast[0].value).toBeGreaterThan(30);
        expect(forecast[2].value).toBeGreaterThan(forecast[0].value);
        
        engine.destroy();
    });

    test('Statistical measures should handle edge cases correctly', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Single value
        const singleValue = [42];
        const medianSingle = engine.calculateMedian(singleValue);
        expect(medianSingle).toBe(42);
        
        // Two values
        const twoValues = [10, 20];
        const medianTwo = engine.calculateMedian(twoValues);
        expect(medianTwo).toBe(15);
        
        // Odd number of values
        const oddValues = [1, 3, 5, 7, 9];
        const medianOdd = engine.calculateMedian(oddValues);
        expect(medianOdd).toBe(5);
        
        // Even number of values
        const evenValues = [2, 4, 6, 8];
        const medianEven = engine.calculateMedian(evenValues);
        expect(medianEven).toBe(5);
        
        engine.destroy();
    });

    test('Financial trends should handle various data patterns', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Create test data with clear trends
        const testData = [
            { date: '2023-01-01', totalRevenue: 100000, totalAssets: 1000000, memberCount: 100 },
            { date: '2023-02-01', totalRevenue: 110000, totalAssets: 1100000, memberCount: 105 },
            { date: '2023-03-01', totalRevenue: 120000, totalAssets: 1200000, memberCount: 110 },
            { date: '2023-04-01', totalRevenue: 130000, totalAssets: 1300000, memberCount: 115 },
            { date: '2023-05-01', totalRevenue: 140000, totalAssets: 1400000, memberCount: 120 },
            { date: '2023-06-01', totalRevenue: 150000, totalAssets: 1500000, memberCount: 125 }
        ];
        
        const trends = await engine.calculateFinancialTrends(testData);
        
        // Should detect increasing trends
        expect(trends.trends.revenue.direction).toBe('increasing');
        expect(trends.trends.assets.direction).toBe('increasing');
        expect(trends.trends.members.direction).toBe('increasing');
        
        // Should have high correlation between revenue and assets
        expect(trends.correlations.revenueAssets).toBeGreaterThan(0.9);
        
        // Should generate forecasts
        expect(trends.forecasts.revenue).toHaveLength(3);
        expect(trends.forecasts.revenue[0].value).toBeGreaterThan(150000);
        
        engine.destroy();
    });
});