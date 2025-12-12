/**
 * Dashboard Analytics & KPI - KPI Calculation Accuracy Property Test
 * 
 * Property-based test for KPI calculation accuracy and mathematical correctness
 * **Feature: dashboard-analytics-kpi, Property 3: KPI Calculation Accuracy**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 */

import fc from 'fast-check';

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock btoa for hashing
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

describe('KPI Calculation Accuracy Property Tests', () => {
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
     * Property 3: KPI Calculation Accuracy
     * For any valid financial data, KPI calculations should be mathematically accurate
     */
    test('Property 3: Financial health score calculation should be mathematically accurate', () => {
        fc.assert(fc.property(
            // Generate arbitrary financial data
            fc.record({
                totalAssets: fc.float({ min: 100000, max: 100000000 }),
                totalLiabilities: fc.float({ min: 0, max: 50000000 }),
                totalEquity: fc.float({ min: 50000, max: 50000000 }),
                totalRevenue: fc.float({ min: 10000, max: 10000000 }),
                totalExpenses: fc.float({ min: 5000, max: 9000000 }),
                cashBalance: fc.float({ min: 1000, max: 5000000 }),
                totalLoans: fc.float({ min: 0, max: 20000000 }),
                totalSavings: fc.float({ min: 10000, max: 30000000 }),
                memberCount: fc.integer({ min: 10, max: 10000 }),
                previousPeriodData: fc.record({
                    totalRevenue: fc.float({ min: 8000, max: 8000000 }),
                    totalAssets: fc.float({ min: 80000, max: 80000000 }),
                    memberCount: fc.integer({ min: 8, max: 8000 })
                })
            }),
            async (financialData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const healthScore = await engine.calculateFinancialHealthScore(financialData);
                    
                    // Property 1: Score should be between 0 and 100
                    const scoreInRange = healthScore.score >= 0 && healthScore.score <= 100;
                    
                    // Property 2: All component scores should be between 0 and 100
                    const componentsInRange = 
                        healthScore.components.liquidity >= 0 && healthScore.components.liquidity <= 100 &&
                        healthScore.components.profitability >= 0 && healthScore.components.profitability <= 100 &&
                        healthScore.components.efficiency >= 0 && healthScore.components.efficiency <= 100 &&
                        healthScore.components.growth >= 0 && healthScore.components.growth <= 100;
                    
                    // Property 3: Grade should correspond to score
                    const gradeCorrect = 
                        (healthScore.score >= 90 && healthScore.grade === 'A') ||
                        (healthScore.score >= 80 && healthScore.score < 90 && healthScore.grade === 'B') ||
                        (healthScore.score >= 70 && healthScore.score < 80 && healthScore.grade === 'C') ||
                        (healthScore.score >= 60 && healthScore.score < 70 && healthScore.grade === 'D') ||
                        (healthScore.score < 60 && healthScore.grade === 'F');
                    
                    // Property 4: Status should correspond to score
                    const statusCorrect = 
                        (healthScore.score >= 90 && healthScore.status === 'Excellent') ||
                        (healthScore.score >= 80 && healthScore.score < 90 && healthScore.status === 'Good') ||
                        (healthScore.score >= 70 && healthScore.score < 80 && healthScore.status === 'Fair') ||
                        (healthScore.score >= 60 && healthScore.score < 70 && healthScore.status === 'Poor') ||
                        (healthScore.score < 60 && healthScore.status === 'Critical');
                    
                    // Property 5: Calculated timestamp should be recent
                    const timestampRecent = 
                        healthScore.calculatedAt instanceof Date &&
                        Date.now() - healthScore.calculatedAt.getTime() < 5000; // Within 5 seconds
                    
                    engine.destroy();
                    
                    return scoreInRange && componentsInRange && gradeCorrect && statusCorrect && timestampRecent;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 100,
            timeout: 10000,
            verbose: true
        });
    });

    /**
     * Property 4: Member Growth Rate Calculation Accuracy
     * For any valid member data, growth rate calculations should be mathematically correct
     */
    test('Property 4: Member growth rate calculation should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.record({
                currentMembers: fc.integer({ min: 10, max: 10000 }),
                previousMembers: fc.integer({ min: 5, max: 8000 }),
                newMembersThisMonth: fc.integer({ min: 0, max: 500 }),
                newMembersLastMonth: fc.integer({ min: 0, max: 400 }),
                activeMembersThisMonth: fc.integer({ min: 5, max: 8000 }),
                activeMembersLastMonth: fc.integer({ min: 3, max: 6000 })
            }),
            async (memberData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const growthMetrics = await engine.calculateMemberGrowthRate(memberData);
                    
                    // Property 1: Overall growth rate should match manual calculation
                    const expectedOverallGrowth = memberData.previousMembers > 0 
                        ? ((memberData.currentMembers - memberData.previousMembers) / memberData.previousMembers) * 100
                        : (memberData.currentMembers > 0 ? 100 : 0);
                    const overallGrowthAccurate = Math.abs(growthMetrics.overallGrowthRate - expectedOverallGrowth) < 0.01;
                    
                    // Property 2: New member growth rate should match manual calculation
                    const expectedNewMemberGrowth = memberData.newMembersLastMonth > 0
                        ? ((memberData.newMembersThisMonth - memberData.newMembersLastMonth) / memberData.newMembersLastMonth) * 100
                        : (memberData.newMembersThisMonth > 0 ? 100 : 0);
                    const newMemberGrowthAccurate = Math.abs(growthMetrics.newMemberGrowthRate - expectedNewMemberGrowth) < 0.01;
                    
                    // Property 3: Activity rate should be between 0 and 100
                    const activityRateValid = growthMetrics.activityRate >= 0 && growthMetrics.activityRate <= 100;
                    
                    // Property 4: Retention rate should be reasonable
                    const retentionRateValid = growthMetrics.retentionRate >= -100 && growthMetrics.retentionRate <= 100;
                    
                    // Property 5: Total members should match input
                    const totalMembersMatch = growthMetrics.totalMembers === memberData.currentMembers;
                    
                    engine.destroy();
                    
                    return overallGrowthAccurate && newMemberGrowthAccurate && activityRateValid && 
                           retentionRateValid && totalMembersMatch;
                    
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
     * Property 5: Transaction Volume Calculation Accuracy
     * For any valid transaction data, volume calculations should be mathematically correct
     */
    test('Property 5: Transaction volume calculation should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.record({
                currentMonthTransactions: fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 10 }),
                        value: fc.float({ min: 1000, max: 1000000 })
                    }),
                    { minLength: 10, maxLength: 1000 }
                ),
                previousMonthTransactions: fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 10 }),
                        value: fc.float({ min: 1000, max: 1000000 })
                    }),
                    { minLength: 5, maxLength: 800 }
                ),
                currentMonthValue: fc.float({ min: 100000, max: 100000000 }),
                previousMonthValue: fc.float({ min: 50000, max: 80000000 })
            }),
            async (transactionData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const volumeMetrics = await engine.calculateTransactionVolume(transactionData);
                    
                    // Property 1: Current month count should match array length
                    const countMatch = volumeMetrics.currentMonthCount === transactionData.currentMonthTransactions.length;
                    
                    // Property 2: Previous month count should match array length
                    const prevCountMatch = volumeMetrics.previousMonthCount === transactionData.previousMonthTransactions.length;
                    
                    // Property 3: Count growth rate should be mathematically correct
                    const expectedCountGrowth = transactionData.previousMonthTransactions.length > 0
                        ? ((transactionData.currentMonthTransactions.length - transactionData.previousMonthTransactions.length) / transactionData.previousMonthTransactions.length) * 100
                        : (transactionData.currentMonthTransactions.length > 0 ? 100 : 0);
                    const countGrowthAccurate = Math.abs(volumeMetrics.countGrowthRate - expectedCountGrowth) < 0.01;
                    
                    // Property 4: Value growth rate should be mathematically correct
                    const expectedValueGrowth = transactionData.previousMonthValue > 0
                        ? ((transactionData.currentMonthValue - transactionData.previousMonthValue) / transactionData.previousMonthValue) * 100
                        : (transactionData.currentMonthValue > 0 ? 100 : 0);
                    const valueGrowthAccurate = Math.abs(volumeMetrics.valueGrowthRate - expectedValueGrowth) < 0.01;
                    
                    // Property 5: Average transaction value should be correct
                    const expectedAvgValue = transactionData.currentMonthTransactions.length > 0
                        ? transactionData.currentMonthValue / transactionData.currentMonthTransactions.length
                        : 0;
                    const avgValueAccurate = Math.abs(volumeMetrics.avgTransactionValue - expectedAvgValue) < 1;
                    
                    // Property 6: Daily averages should be reasonable
                    const dailyAvgCountReasonable = volumeMetrics.dailyAvgCount >= 0 && 
                        volumeMetrics.dailyAvgCount <= transactionData.currentMonthTransactions.length;
                    const dailyAvgValueReasonable = volumeMetrics.dailyAvgValue >= 0 && 
                        volumeMetrics.dailyAvgValue <= transactionData.currentMonthValue;
                    
                    engine.destroy();
                    
                    return countMatch && prevCountMatch && countGrowthAccurate && valueGrowthAccurate && 
                           avgValueAccurate && dailyAvgCountReasonable && dailyAvgValueReasonable;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 50,
            timeout: 10000
        });
    });

    /**
     * Property 6: Financial Ratios Calculation Accuracy
     * For any valid financial data, ratio calculations should be mathematically correct
     */
    test('Property 6: Financial ratios calculation should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.record({
                totalAssets: fc.float({ min: 100000, max: 100000000 }),
                totalLiabilities: fc.float({ min: 10000, max: 50000000 }),
                totalEquity: fc.float({ min: 50000, max: 50000000 }),
                totalRevenue: fc.float({ min: 10000, max: 10000000 }),
                totalExpenses: fc.float({ min: 5000, max: 9000000 }),
                cashBalance: fc.float({ min: 1000, max: 5000000 }),
                totalLoans: fc.float({ min: 0, max: 20000000 }),
                totalSavings: fc.float({ min: 10000, max: 30000000 })
            }),
            async (financialData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const ratios = await engine.calculateFinancialRatios(financialData);
                    const netIncome = financialData.totalRevenue - financialData.totalExpenses;
                    
                    // Property 1: Current ratio should be mathematically correct
                    const expectedCurrentRatio = financialData.totalLiabilities > 0 
                        ? financialData.totalAssets / financialData.totalLiabilities 
                        : 0;
                    const currentRatioAccurate = Math.abs(ratios.liquidity.currentRatio - expectedCurrentRatio) < 0.01;
                    
                    // Property 2: Cash ratio should be mathematically correct
                    const expectedCashRatio = financialData.totalAssets > 0 
                        ? (financialData.cashBalance / financialData.totalAssets) * 100 
                        : 0;
                    const cashRatioAccurate = Math.abs(ratios.liquidity.cashRatio - expectedCashRatio) < 0.01;
                    
                    // Property 3: Profit margin should be mathematically correct
                    const expectedProfitMargin = financialData.totalRevenue > 0 
                        ? (netIncome / financialData.totalRevenue) * 100 
                        : 0;
                    const profitMarginAccurate = Math.abs(ratios.profitability.profitMargin - expectedProfitMargin) < 0.01;
                    
                    // Property 4: ROA should be mathematically correct
                    const expectedROA = financialData.totalAssets > 0 
                        ? (netIncome / financialData.totalAssets) * 100 
                        : 0;
                    const roaAccurate = Math.abs(ratios.profitability.returnOnAssets - expectedROA) < 0.01;
                    
                    // Property 5: Asset turnover should be mathematically correct
                    const expectedAssetTurnover = financialData.totalAssets > 0 
                        ? financialData.totalRevenue / financialData.totalAssets 
                        : 0;
                    const assetTurnoverAccurate = Math.abs(ratios.efficiency.assetTurnover - expectedAssetTurnover) < 0.01;
                    
                    // Property 6: All ratios should be non-negative (except profit margin which can be negative)
                    const ratiosNonNegative = 
                        ratios.liquidity.currentRatio >= 0 &&
                        ratios.liquidity.cashRatio >= 0 &&
                        ratios.profitability.returnOnAssets >= -100 && // Can be negative but reasonable
                        ratios.profitability.returnOnEquity >= -100 &&
                        ratios.efficiency.assetTurnover >= 0 &&
                        ratios.efficiency.operatingRatio >= 0;
                    
                    engine.destroy();
                    
                    return currentRatioAccurate && cashRatioAccurate && profitMarginAccurate && 
                           roaAccurate && assetTurnoverAccurate && ratiosNonNegative;
                    
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
     * Property 7: Growth Rate Calculation Consistency
     * For any two values, growth rate calculation should be consistent and mathematically correct
     */
    test('Property 7: Growth rate calculation should be consistent and accurate', () => {
        fc.assert(fc.property(
            fc.float({ min: 0, max: 1000000 }),
            fc.float({ min: 0, max: 1000000 }),
            async (current, previous) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const growthRate = engine.calculateGrowthRate(current, previous);
                    
                    // Property 1: If previous is 0, growth rate should be 1 if current > 0, else 0
                    if (previous === 0) {
                        const expectedRate = current > 0 ? 1 : 0;
                        const zeroBaseCorrect = Math.abs(growthRate - expectedRate) < 0.0001;
                        engine.destroy();
                        return zeroBaseCorrect;
                    }
                    
                    // Property 2: Growth rate should match manual calculation
                    const expectedGrowthRate = (current - previous) / previous;
                    const calculationAccurate = Math.abs(growthRate - expectedGrowthRate) < 0.0001;
                    
                    // Property 3: If current equals previous, growth rate should be 0
                    if (current === previous) {
                        const noGrowthCorrect = Math.abs(growthRate) < 0.0001;
                        engine.destroy();
                        return noGrowthCorrect;
                    }
                    
                    // Property 4: If current > previous, growth rate should be positive
                    if (current > previous) {
                        const positiveGrowthCorrect = growthRate > 0;
                        engine.destroy();
                        return calculationAccurate && positiveGrowthCorrect;
                    }
                    
                    // Property 5: If current < previous, growth rate should be negative
                    if (current < previous) {
                        const negativeGrowthCorrect = growthRate < 0;
                        engine.destroy();
                        return calculationAccurate && negativeGrowthCorrect;
                    }
                    
                    engine.destroy();
                    return calculationAccurate;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 100,
            timeout: 5000
        });
    });

    /**
     * Property 8: Cache Consistency
     * For any calculation, cached results should be identical to fresh calculations
     */
    test('Property 8: Cache should provide consistent results', () => {
        fc.assert(fc.property(
            fc.record({
                totalAssets: fc.float({ min: 100000, max: 1000000 }),
                totalLiabilities: fc.float({ min: 10000, max: 500000 }),
                totalRevenue: fc.float({ min: 10000, max: 500000 }),
                totalExpenses: fc.float({ min: 5000, max: 400000 }),
                memberCount: fc.integer({ min: 10, max: 1000 })
            }),
            async (data) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    // First calculation (should miss cache)
                    const result1 = await engine.calculateFinancialHealthScore(data);
                    
                    // Second calculation (should hit cache)
                    const result2 = await engine.calculateFinancialHealthScore(data);
                    
                    // Property: Results should be identical
                    const scoresMatch = Math.abs(result1.score - result2.score) < 0.0001;
                    const gradesMatch = result1.grade === result2.grade;
                    const statusMatch = result1.status === result2.status;
                    
                    // Component scores should match
                    const componentsMatch = 
                        Math.abs(result1.components.liquidity - result2.components.liquidity) < 0.0001 &&
                        Math.abs(result1.components.profitability - result2.components.profitability) < 0.0001 &&
                        Math.abs(result1.components.efficiency - result2.components.efficiency) < 0.0001 &&
                        Math.abs(result1.components.growth - result2.components.growth) < 0.0001;
                    
                    engine.destroy();
                    
                    return scoresMatch && gradesMatch && statusMatch && componentsMatch;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 30,
            timeout: 8000
        });
    });
});

/**
 * Integration tests for KPI calculation accuracy
 */
describe('KPI Calculation Integration Tests', () => {
    let AnalyticsEngine;

    beforeAll(async () => {
        const analyticsModule = await import('../../js/dashboard/AnalyticsEngine.js');
        AnalyticsEngine = analyticsModule.AnalyticsEngine;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.performance.now.mockImplementation(() => Date.now());
    });

    test('Complete financial health score calculation should be accurate', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        const testData = {
            totalAssets: 10000000,
            totalLiabilities: 4000000,
            totalEquity: 6000000,
            totalRevenue: 2000000,
            totalExpenses: 1500000,
            cashBalance: 1000000,
            totalLoans: 3000000,
            totalSavings: 8000000,
            memberCount: 500,
            previousPeriodData: {
                totalRevenue: 1800000,
                totalAssets: 9000000,
                memberCount: 450
            }
        };
        
        const healthScore = await engine.calculateFinancialHealthScore(testData);
        
        // Verify structure
        expect(healthScore).toHaveProperty('score');
        expect(healthScore).toHaveProperty('grade');
        expect(healthScore).toHaveProperty('status');
        expect(healthScore).toHaveProperty('components');
        
        // Verify ranges
        expect(healthScore.score).toBeGreaterThanOrEqual(0);
        expect(healthScore.score).toBeLessThanOrEqual(100);
        
        // Verify components
        expect(healthScore.components.liquidity).toBeGreaterThanOrEqual(0);
        expect(healthScore.components.profitability).toBeGreaterThanOrEqual(0);
        expect(healthScore.components.efficiency).toBeGreaterThanOrEqual(0);
        expect(healthScore.components.growth).toBeGreaterThanOrEqual(0);
        
        // Verify grade consistency
        if (healthScore.score >= 90) expect(healthScore.grade).toBe('A');
        else if (healthScore.score >= 80) expect(healthScore.grade).toBe('B');
        else if (healthScore.score >= 70) expect(healthScore.grade).toBe('C');
        else if (healthScore.score >= 60) expect(healthScore.grade).toBe('D');
        else expect(healthScore.grade).toBe('F');
        
        engine.destroy();
    });

    test('Member growth rate calculation should handle edge cases', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Test with zero previous members
        const edgeCase1 = {
            currentMembers: 100,
            previousMembers: 0,
            newMembersThisMonth: 100,
            newMembersLastMonth: 0,
            activeMembersThisMonth: 80,
            activeMembersLastMonth: 0
        };
        
        const result1 = await engine.calculateMemberGrowthRate(edgeCase1);
        expect(result1.overallGrowthRate).toBeGreaterThan(0);
        expect(result1.totalMembers).toBe(100);
        
        // Test with equal current and previous
        const edgeCase2 = {
            currentMembers: 100,
            previousMembers: 100,
            newMembersThisMonth: 10,
            newMembersLastMonth: 10,
            activeMembersThisMonth: 80,
            activeMembersLastMonth: 80
        };
        
        const result2 = await engine.calculateMemberGrowthRate(edgeCase2);
        expect(Math.abs(result2.overallGrowthRate)).toBeLessThan(0.01); // Should be ~0
        expect(result2.totalMembers).toBe(100);
        
        engine.destroy();
    });

    test('Financial ratios calculation should handle zero values correctly', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Test with zero liabilities
        const testData1 = {
            totalAssets: 1000000,
            totalLiabilities: 0,
            totalEquity: 1000000,
            totalRevenue: 100000,
            totalExpenses: 80000,
            cashBalance: 200000,
            totalLoans: 0,
            totalSavings: 500000
        };
        
        const ratios1 = await engine.calculateFinancialRatios(testData1);
        expect(ratios1.liquidity.currentRatio).toBe(0); // Should handle division by zero
        expect(ratios1.liquidity.cashRatio).toBe(20); // 200000/1000000 * 100
        
        // Test with zero revenue
        const testData2 = {
            totalAssets: 1000000,
            totalLiabilities: 400000,
            totalEquity: 600000,
            totalRevenue: 0,
            totalExpenses: 0,
            cashBalance: 200000,
            totalLoans: 300000,
            totalSavings: 500000
        };
        
        const ratios2 = await engine.calculateFinancialRatios(testData2);
        expect(ratios2.profitability.profitMargin).toBe(0);
        expect(ratios2.efficiency.assetTurnover).toBe(0);
        
        engine.destroy();
    });

    test('Transaction volume calculation should handle empty arrays', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        const testData = {
            currentMonthTransactions: [],
            previousMonthTransactions: [],
            currentMonthValue: 0,
            previousMonthValue: 0
        };
        
        const volumeMetrics = await engine.calculateTransactionVolume(testData);
        
        expect(volumeMetrics.currentMonthCount).toBe(0);
        expect(volumeMetrics.previousMonthCount).toBe(0);
        expect(volumeMetrics.avgTransactionValue).toBe(0);
        expect(volumeMetrics.dailyAvgCount).toBe(0);
        expect(volumeMetrics.dailyAvgValue).toBe(0);
        
        engine.destroy();
    });

    test('Performance metrics should be tracked correctly', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        const testData = {
            totalAssets: 1000000,
            totalLiabilities: 400000,
            totalRevenue: 200000,
            totalExpenses: 150000,
            memberCount: 100
        };
        
        // Perform multiple calculations
        await engine.calculateFinancialHealthScore(testData);
        await engine.calculateFinancialRatios(testData);
        
        const metrics = engine.getPerformanceMetrics();
        
        expect(metrics.totalCalculations).toBeGreaterThan(0);
        expect(metrics.averageCalculationTime).toBeGreaterThanOrEqual(0);
        expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
        expect(metrics.isInitialized).toBe(true);
        
        engine.destroy();
    });
});