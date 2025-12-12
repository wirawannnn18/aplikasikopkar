/**
 * Dashboard Analytics & KPI - Financial Ratio Accuracy Property Test
 * 
 * Property-based test for financial ratio calculation accuracy and mathematical correctness
 * **Feature: dashboard-analytics-kpi, Property 4: Financial Ratio Accuracy**
 * **Validates: Requirements 2.4**
 */

import fc from 'fast-check';

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock btoa for hashing
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

describe('Financial Ratio Accuracy Property Tests', () => {
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
     * Property 4: Financial Ratio Accuracy
     * For any valid financial data, ratio calculations should be mathematically accurate
     */
    test('Property 4: Liquidity ratios should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.record({
                totalAssets: fc.float({ min: 100000, max: 100000000 }),
                totalLiabilities: fc.float({ min: 10000, max: 50000000 }),
                cashBalance: fc.float({ min: 1000, max: 10000000 }),
                totalRevenue: fc.float({ min: 10000, max: 10000000 }),
                totalExpenses: fc.float({ min: 5000, max: 9000000 }),
                totalEquity: fc.float({ min: 50000, max: 50000000 }),
                totalLoans: fc.float({ min: 0, max: 20000000 }),
                totalSavings: fc.float({ min: 10000, max: 30000000 })
            }),
            async (financialData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const ratios = await engine.calculateFinancialRatios(financialData);
                    
                    // Property 1: Current ratio should match manual calculation
                    const expectedCurrentRatio = financialData.totalLiabilities > 0 
                        ? financialData.totalAssets / financialData.totalLiabilities 
                        : 0;
                    const currentRatioAccurate = Math.abs(ratios.liquidity.currentRatio - expectedCurrentRatio) < 0.01;
                    
                    // Property 2: Cash ratio should match manual calculation
                    const expectedCashRatio = financialData.totalAssets > 0 
                        ? (financialData.cashBalance / financialData.totalAssets) * 100 
                        : 0;
                    const cashRatioAccurate = Math.abs(ratios.liquidity.cashRatio - expectedCashRatio) < 0.01;
                    
                    // Property 3: Ratios should be non-negative
                    const ratiosNonNegative = 
                        ratios.liquidity.currentRatio >= 0 &&
                        ratios.liquidity.cashRatio >= 0;
                    
                    // Property 4: Result should have proper structure
                    const hasProperStructure = 
                        ratios.liquidity &&
                        typeof ratios.liquidity.currentRatio === 'number' &&
                        typeof ratios.liquidity.cashRatio === 'number' &&
                        ratios.calculatedAt instanceof Date;
                    
                    engine.destroy();
                    
                    return currentRatioAccurate && cashRatioAccurate && ratiosNonNegative && hasProperStructure;
                    
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
     * Property 5: Profitability Ratios Accuracy
     * For any valid financial data, profitability ratios should be mathematically correct
     */
    test('Property 5: Profitability ratios should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.record({
                totalAssets: fc.float({ min: 100000, max: 100000000 }),
                totalLiabilities: fc.float({ min: 10000, max: 50000000 }),
                totalEquity: fc.float({ min: 50000, max: 50000000 }),
                totalRevenue: fc.float({ min: 10000, max: 10000000 }),
                totalExpenses: fc.float({ min: 5000, max: 15000000 }), // Allow losses
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
                    
                    // Property 1: Profit margin should match manual calculation
                    const expectedProfitMargin = financialData.totalRevenue > 0 
                        ? (netIncome / financialData.totalRevenue) * 100 
                        : 0;
                    const profitMarginAccurate = Math.abs(ratios.profitability.profitMargin - expectedProfitMargin) < 0.01;
                    
                    // Property 2: ROA should match manual calculation
                    const expectedROA = financialData.totalAssets > 0 
                        ? (netIncome / financialData.totalAssets) * 100 
                        : 0;
                    const roaAccurate = Math.abs(ratios.profitability.returnOnAssets - expectedROA) < 0.01;
                    
                    // Property 3: ROE should match manual calculation
                    const expectedROE = financialData.totalEquity > 0 
                        ? (netIncome / financialData.totalEquity) * 100 
                        : 0;
                    const roeAccurate = Math.abs(ratios.profitability.returnOnEquity - expectedROE) < 0.01;
                    
                    // Property 4: Ratios should be within reasonable bounds
                    const ratiosReasonable = 
                        ratios.profitability.profitMargin >= -1000 && ratios.profitability.profitMargin <= 1000 &&
                        ratios.profitability.returnOnAssets >= -1000 && ratios.profitability.returnOnAssets <= 1000 &&
                        ratios.profitability.returnOnEquity >= -1000 && ratios.profitability.returnOnEquity <= 1000;
                    
                    // Property 5: Result should have proper structure
                    const hasProperStructure = 
                        ratios.profitability &&
                        typeof ratios.profitability.profitMargin === 'number' &&
                        typeof ratios.profitability.returnOnAssets === 'number' &&
                        typeof ratios.profitability.returnOnEquity === 'number';
                    
                    engine.destroy();
                    
                    return profitMarginAccurate && roaAccurate && roeAccurate && ratiosReasonable && hasProperStructure;
                    
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
     * Property 6: Efficiency Ratios Accuracy
     * For any valid financial data, efficiency ratios should be mathematically correct
     */
    test('Property 6: Efficiency ratios should be mathematically accurate', () => {
        fc.assert(fc.property(
            fc.record({
                totalAssets: fc.float({ min: 100000, max: 100000000 }),
                totalRevenue: fc.float({ min: 10000, max: 10000000 }),
                totalExpenses: fc.float({ min: 5000, max: 9000000 }),
                totalLiabilities: fc.float({ min: 10000, max: 50000000 }),
                totalEquity: fc.float({ min: 50000, max: 50000000 }),
                cashBalance: fc.float({ min: 1000, max: 5000000 }),
                totalLoans: fc.float({ min: 0, max: 20000000 }),
                totalSavings: fc.float({ min: 10000, max: 30000000 })
            }),
            async (financialData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const ratios = await engine.calculateFinancialRatios(financialData);
                    
                    // Property 1: Asset turnover should match manual calculation
                    const expectedAssetTurnover = financialData.totalAssets > 0 
                        ? financialData.totalRevenue / financialData.totalAssets 
                        : 0;
                    const assetTurnoverAccurate = Math.abs(ratios.efficiency.assetTurnover - expectedAssetTurnover) < 0.01;
                    
                    // Property 2: Operating ratio should match manual calculation
                    const expectedOperatingRatio = financialData.totalRevenue > 0 
                        ? (financialData.totalExpenses / financialData.totalRevenue) * 100 
                        : 0;
                    const operatingRatioAccurate = Math.abs(ratios.efficiency.operatingRatio - expectedOperatingRatio) < 0.01;
                    
                    // Property 3: Ratios should be non-negative
                    const ratiosNonNegative = 
                        ratios.efficiency.assetTurnover >= 0 &&
                        ratios.efficiency.operatingRatio >= 0;
                    
                    // Property 4: Asset turnover should be reasonable (not extremely high)
                    const assetTurnoverReasonable = ratios.efficiency.assetTurnover <= 100;
                    
                    // Property 5: Result should have proper structure
                    const hasProperStructure = 
                        ratios.efficiency &&
                        typeof ratios.efficiency.assetTurnover === 'number' &&
                        typeof ratios.efficiency.operatingRatio === 'number';
                    
                    engine.destroy();
                    
                    return assetTurnoverAccurate && operatingRatioAccurate && ratiosNonNegative && 
                           assetTurnoverReasonable && hasProperStructure;
                    
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
     * Property 7: Leverage Ratios Accuracy
     * For any valid financial data, leverage ratios should be mathematically correct
     */
    test('Property 7: Leverage ratios should be mathematically accurate', () => {
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
                    
                    // Property 1: Debt-to-asset ratio should match manual calculation
                    const expectedDebtToAssetRatio = financialData.totalAssets > 0 
                        ? (financialData.totalLiabilities / financialData.totalAssets) * 100 
                        : 0;
                    const debtToAssetAccurate = Math.abs(ratios.leverage.debtToAssetRatio - expectedDebtToAssetRatio) < 0.01;
                    
                    // Property 2: Debt-to-equity ratio should match manual calculation
                    const expectedDebtToEquityRatio = financialData.totalEquity > 0 
                        ? financialData.totalLiabilities / financialData.totalEquity 
                        : 0;
                    const debtToEquityAccurate = Math.abs(ratios.leverage.debtToEquityRatio - expectedDebtToEquityRatio) < 0.01;
                    
                    // Property 3: Loan-to-savings ratio should match manual calculation
                    const expectedLoanToSavingsRatio = financialData.totalSavings > 0 
                        ? (financialData.totalLoans / financialData.totalSavings) * 100 
                        : 0;
                    const loanToSavingsAccurate = Math.abs(ratios.leverage.loanToSavingsRatio - expectedLoanToSavingsRatio) < 0.01;
                    
                    // Property 4: Ratios should be non-negative
                    const ratiosNonNegative = 
                        ratios.leverage.debtToAssetRatio >= 0 &&
                        ratios.leverage.debtToEquityRatio >= 0 &&
                        ratios.leverage.loanToSavingsRatio >= 0;
                    
                    // Property 5: Debt-to-asset ratio should not exceed 100% (in normal cases)
                    const debtToAssetReasonable = ratios.leverage.debtToAssetRatio <= 200; // Allow some flexibility
                    
                    // Property 6: Result should have proper structure
                    const hasProperStructure = 
                        ratios.leverage &&
                        typeof ratios.leverage.debtToAssetRatio === 'number' &&
                        typeof ratios.leverage.debtToEquityRatio === 'number' &&
                        typeof ratios.leverage.loanToSavingsRatio === 'number';
                    
                    engine.destroy();
                    
                    return debtToAssetAccurate && debtToEquityAccurate && loanToSavingsAccurate && 
                           ratiosNonNegative && debtToAssetReasonable && hasProperStructure;
                    
                } catch (error) {
                    engine.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 70,
            timeout: 8000
        });
    });

    /**
     * Property 8: Zero Division Handling
     * For financial data with zero denominators, calculations should handle gracefully
     */
    test('Property 8: Zero division should be handled gracefully', () => {
        fc.assert(fc.property(
            fc.record({
                totalAssets: fc.float({ min: 0, max: 1000000 }),
                totalLiabilities: fc.float({ min: 0, max: 500000 }),
                totalEquity: fc.float({ min: 0, max: 500000 }),
                totalRevenue: fc.float({ min: 0, max: 500000 }),
                totalExpenses: fc.float({ min: 0, max: 400000 }),
                cashBalance: fc.float({ min: 0, max: 200000 }),
                totalLoans: fc.float({ min: 0, max: 300000 }),
                totalSavings: fc.float({ min: 0, max: 400000 })
            }),
            async (financialData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    const ratios = await engine.calculateFinancialRatios(financialData);
                    
                    // Property 1: All ratio values should be numbers (not NaN or Infinity)
                    const allNumbers = 
                        !isNaN(ratios.liquidity.currentRatio) && isFinite(ratios.liquidity.currentRatio) &&
                        !isNaN(ratios.liquidity.cashRatio) && isFinite(ratios.liquidity.cashRatio) &&
                        !isNaN(ratios.profitability.profitMargin) && isFinite(ratios.profitability.profitMargin) &&
                        !isNaN(ratios.profitability.returnOnAssets) && isFinite(ratios.profitability.returnOnAssets) &&
                        !isNaN(ratios.profitability.returnOnEquity) && isFinite(ratios.profitability.returnOnEquity) &&
                        !isNaN(ratios.efficiency.assetTurnover) && isFinite(ratios.efficiency.assetTurnover) &&
                        !isNaN(ratios.efficiency.operatingRatio) && isFinite(ratios.efficiency.operatingRatio) &&
                        !isNaN(ratios.leverage.debtToAssetRatio) && isFinite(ratios.leverage.debtToAssetRatio) &&
                        !isNaN(ratios.leverage.debtToEquityRatio) && isFinite(ratios.leverage.debtToEquityRatio) &&
                        !isNaN(ratios.leverage.loanToSavingsRatio) && isFinite(ratios.leverage.loanToSavingsRatio);
                    
                    // Property 2: Zero denominators should result in zero ratios
                    if (financialData.totalLiabilities === 0) {
                        const currentRatioZero = ratios.liquidity.currentRatio === 0;
                        if (!currentRatioZero) {
                            engine.destroy();
                            return false;
                        }
                    }
                    
                    if (financialData.totalAssets === 0) {
                        const cashRatioZero = ratios.liquidity.cashRatio === 0;
                        const roaZero = ratios.profitability.returnOnAssets === 0;
                        const assetTurnoverZero = ratios.efficiency.assetTurnover === 0;
                        const debtToAssetZero = ratios.leverage.debtToAssetRatio === 0;
                        
                        if (!cashRatioZero || !roaZero || !assetTurnoverZero || !debtToAssetZero) {
                            engine.destroy();
                            return false;
                        }
                    }
                    
                    if (financialData.totalRevenue === 0) {
                        const profitMarginZero = ratios.profitability.profitMargin === 0;
                        const operatingRatioZero = ratios.efficiency.operatingRatio === 0;
                        
                        if (!profitMarginZero || !operatingRatioZero) {
                            engine.destroy();
                            return false;
                        }
                    }
                    
                    // Property 3: Result should have proper structure even with zeros
                    const hasProperStructure = 
                        ratios.liquidity && ratios.profitability && ratios.efficiency && ratios.leverage &&
                        ratios.calculatedAt instanceof Date;
                    
                    engine.destroy();
                    
                    return allNumbers && hasProperStructure;
                    
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
     * Property 9: Ratio Consistency
     * For the same input data, ratios should be consistent across multiple calculations
     */
    test('Property 9: Ratio calculations should be consistent', () => {
        fc.assert(fc.property(
            fc.record({
                totalAssets: fc.float({ min: 100000, max: 10000000 }),
                totalLiabilities: fc.float({ min: 10000, max: 5000000 }),
                totalEquity: fc.float({ min: 50000, max: 5000000 }),
                totalRevenue: fc.float({ min: 10000, max: 1000000 }),
                totalExpenses: fc.float({ min: 5000, max: 900000 }),
                cashBalance: fc.float({ min: 1000, max: 500000 }),
                totalLoans: fc.float({ min: 0, max: 2000000 }),
                totalSavings: fc.float({ min: 10000, max: 3000000 })
            }),
            async (financialData) => {
                const engine = new AnalyticsEngine();
                await engine.initialize();
                
                try {
                    // Calculate ratios multiple times
                    const ratios1 = await engine.calculateFinancialRatios(financialData);
                    const ratios2 = await engine.calculateFinancialRatios(financialData);
                    const ratios3 = await engine.calculateFinancialRatios(financialData);
                    
                    // Property: All calculations should produce identical results
                    const liquidityConsistent = 
                        Math.abs(ratios1.liquidity.currentRatio - ratios2.liquidity.currentRatio) < 0.0001 &&
                        Math.abs(ratios2.liquidity.currentRatio - ratios3.liquidity.currentRatio) < 0.0001 &&
                        Math.abs(ratios1.liquidity.cashRatio - ratios2.liquidity.cashRatio) < 0.0001 &&
                        Math.abs(ratios2.liquidity.cashRatio - ratios3.liquidity.cashRatio) < 0.0001;
                    
                    const profitabilityConsistent = 
                        Math.abs(ratios1.profitability.profitMargin - ratios2.profitability.profitMargin) < 0.0001 &&
                        Math.abs(ratios2.profitability.profitMargin - ratios3.profitability.profitMargin) < 0.0001 &&
                        Math.abs(ratios1.profitability.returnOnAssets - ratios2.profitability.returnOnAssets) < 0.0001 &&
                        Math.abs(ratios2.profitability.returnOnAssets - ratios3.profitability.returnOnAssets) < 0.0001;
                    
                    const efficiencyConsistent = 
                        Math.abs(ratios1.efficiency.assetTurnover - ratios2.efficiency.assetTurnover) < 0.0001 &&
                        Math.abs(ratios2.efficiency.assetTurnover - ratios3.efficiency.assetTurnover) < 0.0001 &&
                        Math.abs(ratios1.efficiency.operatingRatio - ratios2.efficiency.operatingRatio) < 0.0001 &&
                        Math.abs(ratios2.efficiency.operatingRatio - ratios3.efficiency.operatingRatio) < 0.0001;
                    
                    const leverageConsistent = 
                        Math.abs(ratios1.leverage.debtToAssetRatio - ratios2.leverage.debtToAssetRatio) < 0.0001 &&
                        Math.abs(ratios2.leverage.debtToAssetRatio - ratios3.leverage.debtToAssetRatio) < 0.0001 &&
                        Math.abs(ratios1.leverage.debtToEquityRatio - ratios2.leverage.debtToEquityRatio) < 0.0001 &&
                        Math.abs(ratios2.leverage.debtToEquityRatio - ratios3.leverage.debtToEquityRatio) < 0.0001;
                    
                    engine.destroy();
                    
                    return liquidityConsistent && profitabilityConsistent && efficiencyConsistent && leverageConsistent;
                    
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
});

/**
 * Integration tests for financial ratio accuracy
 */
describe('Financial Ratio Integration Tests', () => {
    let AnalyticsEngine;

    beforeAll(async () => {
        const analyticsModule = await import('../../js/dashboard/AnalyticsEngine.js');
        AnalyticsEngine = analyticsModule.AnalyticsEngine;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.performance.now.mockImplementation(() => Date.now());
    });

    test('Complete financial ratios calculation should be accurate', async () => {
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
            totalSavings: 8000000
        };
        
        const ratios = await engine.calculateFinancialRatios(testData);
        
        // Verify structure
        expect(ratios).toHaveProperty('liquidity');
        expect(ratios).toHaveProperty('profitability');
        expect(ratios).toHaveProperty('efficiency');
        expect(ratios).toHaveProperty('leverage');
        expect(ratios).toHaveProperty('calculatedAt');
        
        // Verify liquidity ratios
        expect(ratios.liquidity.currentRatio).toBeCloseTo(2.5, 2); // 10M / 4M
        expect(ratios.liquidity.cashRatio).toBeCloseTo(10, 2); // (1M / 10M) * 100
        
        // Verify profitability ratios
        const netIncome = testData.totalRevenue - testData.totalExpenses; // 500000
        expect(ratios.profitability.profitMargin).toBeCloseTo(25, 2); // (500000 / 2000000) * 100
        expect(ratios.profitability.returnOnAssets).toBeCloseTo(5, 2); // (500000 / 10000000) * 100
        expect(ratios.profitability.returnOnEquity).toBeCloseTo(8.33, 2); // (500000 / 6000000) * 100
        
        // Verify efficiency ratios
        expect(ratios.efficiency.assetTurnover).toBeCloseTo(0.2, 2); // 2000000 / 10000000
        expect(ratios.efficiency.operatingRatio).toBeCloseTo(75, 2); // (1500000 / 2000000) * 100
        
        // Verify leverage ratios
        expect(ratios.leverage.debtToAssetRatio).toBeCloseTo(40, 2); // (4000000 / 10000000) * 100
        expect(ratios.leverage.debtToEquityRatio).toBeCloseTo(0.67, 2); // 4000000 / 6000000
        expect(ratios.leverage.loanToSavingsRatio).toBeCloseTo(37.5, 2); // (3000000 / 8000000) * 100
        
        engine.destroy();
    });

    test('Financial ratios should handle profitable vs loss scenarios', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // Profitable scenario
        const profitableData = {
            totalAssets: 5000000,
            totalLiabilities: 2000000,
            totalEquity: 3000000,
            totalRevenue: 1000000,
            totalExpenses: 800000,
            cashBalance: 500000,
            totalLoans: 1500000,
            totalSavings: 4000000
        };
        
        const profitableRatios = await engine.calculateFinancialRatios(profitableData);
        expect(profitableRatios.profitability.profitMargin).toBeGreaterThan(0);
        expect(profitableRatios.profitability.returnOnAssets).toBeGreaterThan(0);
        expect(profitableRatios.profitability.returnOnEquity).toBeGreaterThan(0);
        
        // Loss scenario
        const lossData = {
            totalAssets: 5000000,
            totalLiabilities: 2000000,
            totalEquity: 3000000,
            totalRevenue: 800000,
            totalExpenses: 1000000, // Loss
            cashBalance: 500000,
            totalLoans: 1500000,
            totalSavings: 4000000
        };
        
        const lossRatios = await engine.calculateFinancialRatios(lossData);
        expect(lossRatios.profitability.profitMargin).toBeLessThan(0);
        expect(lossRatios.profitability.returnOnAssets).toBeLessThan(0);
        expect(lossRatios.profitability.returnOnEquity).toBeLessThan(0);
        
        engine.destroy();
    });

    test('Financial ratios should handle extreme values correctly', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        // High leverage scenario
        const highLeverageData = {
            totalAssets: 1000000,
            totalLiabilities: 900000, // 90% debt
            totalEquity: 100000,
            totalRevenue: 200000,
            totalExpenses: 180000,
            cashBalance: 50000,
            totalLoans: 800000,
            totalSavings: 200000
        };
        
        const highLeverageRatios = await engine.calculateFinancialRatios(highLeverageData);
        expect(highLeverageRatios.leverage.debtToAssetRatio).toBeCloseTo(90, 1);
        expect(highLeverageRatios.leverage.debtToEquityRatio).toBeCloseTo(9, 1);
        expect(highLeverageRatios.liquidity.currentRatio).toBeCloseTo(1.11, 2);
        
        // Low leverage scenario
        const lowLeverageData = {
            totalAssets: 1000000,
            totalLiabilities: 100000, // 10% debt
            totalEquity: 900000,
            totalRevenue: 200000,
            totalExpenses: 150000,
            cashBalance: 300000,
            totalLoans: 50000,
            totalSavings: 800000
        };
        
        const lowLeverageRatios = await engine.calculateFinancialRatios(lowLeverageData);
        expect(lowLeverageRatios.leverage.debtToAssetRatio).toBeCloseTo(10, 1);
        expect(lowLeverageRatios.leverage.debtToEquityRatio).toBeCloseTo(0.11, 2);
        expect(lowLeverageRatios.liquidity.currentRatio).toBeCloseTo(10, 1);
        
        engine.destroy();
    });

    test('Financial ratios should be cached correctly', async () => {
        const engine = new AnalyticsEngine();
        await engine.initialize();
        
        const testData = {
            totalAssets: 1000000,
            totalLiabilities: 400000,
            totalEquity: 600000,
            totalRevenue: 200000,
            totalExpenses: 150000,
            cashBalance: 100000,
            totalLoans: 300000,
            totalSavings: 800000
        };
        
        // First calculation
        const start1 = performance.now();
        const ratios1 = await engine.calculateFinancialRatios(testData);
        const time1 = performance.now() - start1;
        
        // Second calculation (should be cached)
        const start2 = performance.now();
        const ratios2 = await engine.calculateFinancialRatios(testData);
        const time2 = performance.now() - start2;
        
        // Verify results are identical
        expect(ratios1.liquidity.currentRatio).toEqual(ratios2.liquidity.currentRatio);
        expect(ratios1.profitability.profitMargin).toEqual(ratios2.profitability.profitMargin);
        expect(ratios1.efficiency.assetTurnover).toEqual(ratios2.efficiency.assetTurnover);
        expect(ratios1.leverage.debtToAssetRatio).toEqual(ratios2.leverage.debtToAssetRatio);
        
        // Verify cache performance (second call should be faster)
        expect(time2).toBeLessThan(time1);
        
        engine.destroy();
    });
});