/**
 * Dashboard Analytics & KPI - Analytics Engine
 * 
 * Core analytics engine for calculating KPIs, financial metrics, and business intelligence.
 * Handles financial health scores, member analytics, transaction analysis, and trend calculations.
 */

class AnalyticsEngine {
    /**
     * Initialize Analytics Engine
     */
    constructor() {
        this.isInitialized = false;
        this.dataCache = new Map();
        this.calculationCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        // Financial health score weights
        this.healthScoreWeights = {
            liquidity: 0.25,
            profitability: 0.30,
            efficiency: 0.25,
            growth: 0.20
        };
        
        // Performance tracking
        this.performanceMetrics = {
            calculationTimes: [],
            cacheHits: 0,
            cacheMisses: 0,
            totalCalculations: 0
        };
    }

    /**
     * Initialize analytics engine
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing Analytics Engine...');
            
            // Setup cache cleanup interval
            this.setupCacheCleanup();
            
            // Initialize calculation modules
            this.initializeCalculationModules();
            
            this.isInitialized = true;
            console.log('Analytics Engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Analytics Engine:', error);
            throw error;
        }
    }

    /**
     * Initialize calculation modules
     * @private
     */
    initializeCalculationModules() {
        // Financial calculations module
        this.financial = {
            calculateHealthScore: this.calculateFinancialHealthScore.bind(this),
            calculateRatios: this.calculateFinancialRatios.bind(this),
            calculateGrowthRate: this.calculateGrowthRate.bind(this),
            calculateTrends: this.calculateFinancialTrends.bind(this)
        };
        
        // Member analytics module
        this.members = {
            calculateGrowthRate: this.calculateMemberGrowthRate.bind(this),
            calculateActivityMetrics: this.calculateMemberActivityMetrics.bind(this),
            calculateSegmentation: this.calculateMemberSegmentation.bind(this),
            calculateEngagement: this.calculateMemberEngagement.bind(this)
        };
        
        // Statistical analysis module
        this.statistics = {
            calculateCorrelation: this.calculateCorrelation.bind(this),
            detectAnomalies: this.detectAnomalies.bind(this),
            generateForecast: this.generateForecast.bind(this),
            calculateTrend: this.calculateLinearTrend.bind(this)
        };
        
        // Transaction analytics module
        this.transactions = {
            calculateVolume: this.calculateTransactionVolume.bind(this),
            calculateTrends: this.calculateTransactionTrends.bind(this),
            calculateAverages: this.calculateTransactionAverages.bind(this),
            calculateDistribution: this.calculateTransactionDistribution.bind(this)
        };
    }

    /**
     * Calculate Financial Health Score
     * @param {Object} financialData - Financial data object
     * @returns {Promise<FinancialHealthScore>}
     */
    async calculateFinancialHealthScore(financialData) {
        const cacheKey = `health_score_${this.hashObject(financialData)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const startTime = performance.now();
        
        try {
            // Extract financial metrics
            const {
                totalAssets = 0,
                totalLiabilities = 0,
                totalEquity = 0,
                totalRevenue = 0,
                totalExpenses = 0,
                cashBalance = 0,
                totalLoans = 0,
                totalSavings = 0,
                memberCount = 0,
                previousPeriodData = {}
            } = financialData;
            
            // Calculate component scores (0-100)
            const liquidityScore = this.calculateLiquidityScore({
                cashBalance,
                totalAssets,
                totalLiabilities,
                totalLoans
            });
            
            const profitabilityScore = this.calculateProfitabilityScore({
                totalRevenue,
                totalExpenses,
                totalAssets,
                totalEquity
            });
            
            const efficiencyScore = this.calculateEfficiencyScore({
                totalRevenue,
                totalExpenses,
                totalAssets,
                memberCount
            });
            
            const growthScore = this.calculateGrowthScore({
                current: { totalRevenue, totalAssets, memberCount },
                previous: previousPeriodData
            });
            
            // Calculate weighted overall score
            const overallScore = (
                liquidityScore * this.healthScoreWeights.liquidity +
                profitabilityScore * this.healthScoreWeights.profitability +
                efficiencyScore * this.healthScoreWeights.efficiency +
                growthScore * this.healthScoreWeights.growth
            );
            
            // Determine grade and status
            const grade = this.getHealthGrade(overallScore);
            const status = this.getHealthStatus(overallScore);
            
            const result = {
                score: Math.round(overallScore * 100) / 100,
                grade,
                status,
                components: {
                    liquidity: Math.round(liquidityScore * 100) / 100,
                    profitability: Math.round(profitabilityScore * 100) / 100,
                    efficiency: Math.round(efficiencyScore * 100) / 100,
                    growth: Math.round(growthScore * 100) / 100
                },
                calculatedAt: new Date(),
                dataHash: this.hashObject(financialData)
            };
            
            // Cache result
            this.setCache(cacheKey, result);
            
            // Track performance
            this.trackCalculationPerformance('financial_health_score', startTime);
            
            return result;
            
        } catch (error) {
            console.error('Failed to calculate financial health score:', error);
            throw error;
        }
    }

    /**
     * Calculate liquidity score component
     * @param {Object} data - Liquidity data
     * @returns {number} Score 0-100
     * @private
     */
    calculateLiquidityScore({ cashBalance, totalAssets, totalLiabilities, totalLoans }) {
        if (totalAssets === 0) return 0;
        
        // Current ratio (assets / liabilities)
        const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 100;
        
        // Cash ratio (cash / total assets)
        const cashRatio = cashBalance / totalAssets;
        
        // Loan to asset ratio
        const loanToAssetRatio = totalLoans / totalAssets;
        
        // Calculate score based on ratios
        let score = 0;
        
        // Current ratio scoring (40% weight)
        if (currentRatio >= 2.0) score += 40;
        else if (currentRatio >= 1.5) score += 30;
        else if (currentRatio >= 1.2) score += 20;
        else if (currentRatio >= 1.0) score += 10;
        
        // Cash ratio scoring (30% weight)
        if (cashRatio >= 0.20) score += 30;
        else if (cashRatio >= 0.15) score += 25;
        else if (cashRatio >= 0.10) score += 20;
        else if (cashRatio >= 0.05) score += 10;
        
        // Loan to asset ratio scoring (30% weight) - lower is better
        if (loanToAssetRatio <= 0.30) score += 30;
        else if (loanToAssetRatio <= 0.50) score += 25;
        else if (loanToAssetRatio <= 0.70) score += 15;
        else if (loanToAssetRatio <= 0.85) score += 5;
        
        return Math.min(100, score);
    }

    /**
     * Calculate profitability score component
     * @param {Object} data - Profitability data
     * @returns {number} Score 0-100
     * @private
     */
    calculateProfitabilityScore({ totalRevenue, totalExpenses, totalAssets, totalEquity }) {
        if (totalRevenue === 0) return 0;
        
        // Net profit margin
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = netProfit / totalRevenue;
        
        // Return on assets (ROA)
        const roa = totalAssets > 0 ? netProfit / totalAssets : 0;
        
        // Return on equity (ROE)
        const roe = totalEquity > 0 ? netProfit / totalEquity : 0;
        
        let score = 0;
        
        // Profit margin scoring (40% weight)
        if (profitMargin >= 0.15) score += 40;
        else if (profitMargin >= 0.10) score += 30;
        else if (profitMargin >= 0.05) score += 20;
        else if (profitMargin >= 0.02) score += 10;
        else if (profitMargin >= 0) score += 5;
        
        // ROA scoring (30% weight)
        if (roa >= 0.10) score += 30;
        else if (roa >= 0.07) score += 25;
        else if (roa >= 0.05) score += 20;
        else if (roa >= 0.02) score += 10;
        else if (roa >= 0) score += 5;
        
        // ROE scoring (30% weight)
        if (roe >= 0.15) score += 30;
        else if (roe >= 0.12) score += 25;
        else if (roe >= 0.08) score += 20;
        else if (roe >= 0.05) score += 10;
        else if (roe >= 0) score += 5;
        
        return Math.min(100, score);
    }

    /**
     * Calculate efficiency score component
     * @param {Object} data - Efficiency data
     * @returns {number} Score 0-100
     * @private
     */
    calculateEfficiencyScore({ totalRevenue, totalExpenses, totalAssets, memberCount }) {
        if (totalRevenue === 0 || memberCount === 0) return 0;
        
        // Operating efficiency (expenses / revenue)
        const operatingRatio = totalExpenses / totalRevenue;
        
        // Asset turnover (revenue / assets)
        const assetTurnover = totalAssets > 0 ? totalRevenue / totalAssets : 0;
        
        // Revenue per member
        const revenuePerMember = totalRevenue / memberCount;
        
        let score = 0;
        
        // Operating ratio scoring (40% weight) - lower is better
        if (operatingRatio <= 0.70) score += 40;
        else if (operatingRatio <= 0.80) score += 30;
        else if (operatingRatio <= 0.90) score += 20;
        else if (operatingRatio <= 0.95) score += 10;
        
        // Asset turnover scoring (30% weight)
        if (assetTurnover >= 1.5) score += 30;
        else if (assetTurnover >= 1.2) score += 25;
        else if (assetTurnover >= 1.0) score += 20;
        else if (assetTurnover >= 0.8) score += 15;
        else if (assetTurnover >= 0.5) score += 10;
        
        // Revenue per member scoring (30% weight)
        if (revenuePerMember >= 1000000) score += 30; // 1M IDR
        else if (revenuePerMember >= 750000) score += 25;
        else if (revenuePerMember >= 500000) score += 20;
        else if (revenuePerMember >= 250000) score += 15;
        else if (revenuePerMember >= 100000) score += 10;
        
        return Math.min(100, score);
    }

    /**
     * Calculate growth score component
     * @param {Object} data - Growth data
     * @returns {number} Score 0-100
     * @private
     */
    calculateGrowthScore({ current, previous }) {
        if (!previous || Object.keys(previous).length === 0) return 50; // Neutral score for no historical data
        
        // Revenue growth rate
        const revenueGrowth = this.calculateGrowthRate(current.totalRevenue, previous.totalRevenue);
        
        // Asset growth rate
        const assetGrowth = this.calculateGrowthRate(current.totalAssets, previous.totalAssets);
        
        // Member growth rate
        const memberGrowth = this.calculateGrowthRate(current.memberCount, previous.memberCount);
        
        let score = 0;
        
        // Revenue growth scoring (40% weight)
        if (revenueGrowth >= 0.20) score += 40;
        else if (revenueGrowth >= 0.15) score += 35;
        else if (revenueGrowth >= 0.10) score += 30;
        else if (revenueGrowth >= 0.05) score += 25;
        else if (revenueGrowth >= 0) score += 20;
        else if (revenueGrowth >= -0.05) score += 10;
        
        // Asset growth scoring (30% weight)
        if (assetGrowth >= 0.15) score += 30;
        else if (assetGrowth >= 0.10) score += 25;
        else if (assetGrowth >= 0.05) score += 20;
        else if (assetGrowth >= 0) score += 15;
        else if (assetGrowth >= -0.05) score += 5;
        
        // Member growth scoring (30% weight)
        if (memberGrowth >= 0.15) score += 30;
        else if (memberGrowth >= 0.10) score += 25;
        else if (memberGrowth >= 0.05) score += 20;
        else if (memberGrowth >= 0) score += 15;
        else if (memberGrowth >= -0.02) score += 10;
        
        return Math.min(100, score);
    }

    /**
     * Calculate growth rate between two values
     * @param {number} current - Current value
     * @param {number} previous - Previous value
     * @returns {number} Growth rate as decimal
     */
    calculateGrowthRate(current, previous) {
        if (!previous || previous === 0) return current > 0 ? 1 : 0;
        return (current - previous) / previous;
    }

    /**
     * Get health grade from score
     * @param {number} score - Health score 0-100
     * @returns {string} Grade A-F
     * @private
     */
    getHealthGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Get health status from score
     * @param {number} score - Health score 0-100
     * @returns {string} Status description
     * @private
     */
    getHealthStatus(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Fair';
        if (score >= 60) return 'Poor';
        return 'Critical';
    }

    /**
     * Calculate member growth rate
     * @param {Object} memberData - Member data
     * @returns {Promise<Object>} Member growth metrics
     */
    async calculateMemberGrowthRate(memberData) {
        const cacheKey = `member_growth_${this.hashObject(memberData)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const startTime = performance.now();
        
        try {
            const {
                currentMembers = 0,
                previousMembers = 0,
                newMembersThisMonth = 0,
                newMembersLastMonth = 0,
                activeMembersThisMonth = 0,
                activeMembersLastMonth = 0
            } = memberData;
            
            // Overall growth rate
            const overallGrowthRate = this.calculateGrowthRate(currentMembers, previousMembers);
            
            // New member growth rate
            const newMemberGrowthRate = this.calculateGrowthRate(newMembersThisMonth, newMembersLastMonth);
            
            // Active member growth rate
            const activeMemberGrowthRate = this.calculateGrowthRate(activeMembersThisMonth, activeMembersLastMonth);
            
            // Member retention rate
            const retentionRate = previousMembers > 0 
                ? (currentMembers - newMembersThisMonth) / previousMembers 
                : 0;
            
            // Activity rate
            const activityRate = currentMembers > 0 ? activeMembersThisMonth / currentMembers : 0;
            
            const result = {
                overallGrowthRate: Math.round(overallGrowthRate * 10000) / 100, // Percentage
                newMemberGrowthRate: Math.round(newMemberGrowthRate * 10000) / 100,
                activeMemberGrowthRate: Math.round(activeMemberGrowthRate * 10000) / 100,
                retentionRate: Math.round(retentionRate * 10000) / 100,
                activityRate: Math.round(activityRate * 10000) / 100,
                totalMembers: currentMembers,
                newMembers: newMembersThisMonth,
                activeMembers: activeMembersThisMonth,
                calculatedAt: new Date()
            };
            
            this.setCache(cacheKey, result);
            this.trackCalculationPerformance('member_growth_rate', startTime);
            
            return result;
            
        } catch (error) {
            console.error('Failed to calculate member growth rate:', error);
            throw error;
        }
    }

    /**
     * Calculate transaction volume metrics
     * @param {Object} transactionData - Transaction data
     * @returns {Promise<Object>} Transaction volume metrics
     */
    async calculateTransactionVolume(transactionData) {
        const cacheKey = `transaction_volume_${this.hashObject(transactionData)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const startTime = performance.now();
        
        try {
            const {
                currentMonthTransactions = [],
                previousMonthTransactions = [],
                currentMonthValue = 0,
                previousMonthValue = 0
            } = transactionData;
            
            // Transaction count metrics
            const currentCount = currentMonthTransactions.length;
            const previousCount = previousMonthTransactions.length;
            const countGrowthRate = this.calculateGrowthRate(currentCount, previousCount);
            
            // Transaction value metrics
            const valueGrowthRate = this.calculateGrowthRate(currentMonthValue, previousMonthValue);
            
            // Average transaction value
            const avgTransactionValue = currentCount > 0 ? currentMonthValue / currentCount : 0;
            const prevAvgTransactionValue = previousCount > 0 ? previousMonthValue / previousCount : 0;
            const avgValueGrowthRate = this.calculateGrowthRate(avgTransactionValue, prevAvgTransactionValue);
            
            // Daily averages
            const dailyAvgCount = currentCount / 30; // Assuming 30 days
            const dailyAvgValue = currentMonthValue / 30;
            
            const result = {
                currentMonthCount: currentCount,
                previousMonthCount: previousCount,
                countGrowthRate: Math.round(countGrowthRate * 10000) / 100,
                currentMonthValue: currentMonthValue,
                previousMonthValue: previousMonthValue,
                valueGrowthRate: Math.round(valueGrowthRate * 10000) / 100,
                avgTransactionValue: Math.round(avgTransactionValue),
                avgValueGrowthRate: Math.round(avgValueGrowthRate * 10000) / 100,
                dailyAvgCount: Math.round(dailyAvgCount * 100) / 100,
                dailyAvgValue: Math.round(dailyAvgValue),
                calculatedAt: new Date()
            };
            
            this.setCache(cacheKey, result);
            this.trackCalculationPerformance('transaction_volume', startTime);
            
            return result;
            
        } catch (error) {
            console.error('Failed to calculate transaction volume:', error);
            throw error;
        }
    }

    /**
     * Calculate financial ratios
     * @param {Object} financialData - Financial data
     * @returns {Promise<Object>} Financial ratios
     */
    async calculateFinancialRatios(financialData) {
        const cacheKey = `financial_ratios_${this.hashObject(financialData)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const startTime = performance.now();
        
        try {
            const {
                totalAssets = 0,
                totalLiabilities = 0,
                totalEquity = 0,
                totalRevenue = 0,
                totalExpenses = 0,
                cashBalance = 0,
                totalLoans = 0,
                totalSavings = 0
            } = financialData;
            
            const netIncome = totalRevenue - totalExpenses;
            
            // Liquidity Ratios
            const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0;
            const cashRatio = totalAssets > 0 ? cashBalance / totalAssets : 0;
            
            // Profitability Ratios
            const profitMargin = totalRevenue > 0 ? netIncome / totalRevenue : 0;
            const returnOnAssets = totalAssets > 0 ? netIncome / totalAssets : 0;
            const returnOnEquity = totalEquity > 0 ? netIncome / totalEquity : 0;
            
            // Efficiency Ratios
            const assetTurnover = totalAssets > 0 ? totalRevenue / totalAssets : 0;
            const operatingRatio = totalRevenue > 0 ? totalExpenses / totalRevenue : 0;
            
            // Leverage Ratios
            const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
            const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
            const loanToSavingsRatio = totalSavings > 0 ? totalLoans / totalSavings : 0;
            
            const result = {
                liquidity: {
                    currentRatio: Math.round(currentRatio * 100) / 100,
                    cashRatio: Math.round(cashRatio * 10000) / 100 // Percentage
                },
                profitability: {
                    profitMargin: Math.round(profitMargin * 10000) / 100,
                    returnOnAssets: Math.round(returnOnAssets * 10000) / 100,
                    returnOnEquity: Math.round(returnOnEquity * 10000) / 100
                },
                efficiency: {
                    assetTurnover: Math.round(assetTurnover * 100) / 100,
                    operatingRatio: Math.round(operatingRatio * 10000) / 100
                },
                leverage: {
                    debtToAssetRatio: Math.round(debtToAssetRatio * 10000) / 100,
                    debtToEquityRatio: Math.round(debtToEquityRatio * 100) / 100,
                    loanToSavingsRatio: Math.round(loanToSavingsRatio * 10000) / 100
                },
                calculatedAt: new Date()
            };
            
            this.setCache(cacheKey, result);
            this.trackCalculationPerformance('financial_ratios', startTime);
            
            return result;
            
        } catch (error) {
            console.error('Failed to calculate financial ratios:', error);
            throw error;
        }
    }

    /**
     * Calculate financial trends and forecasting
     * @param {Array} historicalData - Array of historical financial data
     * @returns {Promise<Object>} Trend analysis and forecast
     */
    async calculateFinancialTrends(historicalData) {
        const cacheKey = `financial_trends_${this.hashObject(historicalData)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const startTime = performance.now();
        
        try {
            if (!Array.isArray(historicalData) || historicalData.length < 2) {
                throw new Error('Historical data must be an array with at least 2 data points');
            }
            
            // Sort data by date
            const sortedData = historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calculate trends for key metrics
            const revenueTrend = this.calculateLinearTrend(sortedData.map(d => d.totalRevenue || 0));
            const assetTrend = this.calculateLinearTrend(sortedData.map(d => d.totalAssets || 0));
            const memberTrend = this.calculateLinearTrend(sortedData.map(d => d.memberCount || 0));
            
            // Calculate correlation between metrics
            const revenueAssetCorrelation = this.calculateCorrelation(
                sortedData.map(d => d.totalRevenue || 0),
                sortedData.map(d => d.totalAssets || 0)
            );
            
            const revenueMemberCorrelation = this.calculateCorrelation(
                sortedData.map(d => d.totalRevenue || 0),
                sortedData.map(d => d.memberCount || 0)
            );
            
            // Detect anomalies
            const revenueAnomalies = this.detectAnomalies(sortedData.map(d => d.totalRevenue || 0));
            const assetAnomalies = this.detectAnomalies(sortedData.map(d => d.totalAssets || 0));
            
            // Generate forecasts (next 3 periods)
            const revenueForecast = this.generateForecast(sortedData.map(d => d.totalRevenue || 0), 3);
            const assetForecast = this.generateForecast(sortedData.map(d => d.totalAssets || 0), 3);
            const memberForecast = this.generateForecast(sortedData.map(d => d.memberCount || 0), 3);
            
            const result = {
                trends: {
                    revenue: {
                        slope: revenueTrend.slope,
                        intercept: revenueTrend.intercept,
                        rSquared: revenueTrend.rSquared,
                        direction: revenueTrend.slope > 0 ? 'increasing' : revenueTrend.slope < 0 ? 'decreasing' : 'stable'
                    },
                    assets: {
                        slope: assetTrend.slope,
                        intercept: assetTrend.intercept,
                        rSquared: assetTrend.rSquared,
                        direction: assetTrend.slope > 0 ? 'increasing' : assetTrend.slope < 0 ? 'decreasing' : 'stable'
                    },
                    members: {
                        slope: memberTrend.slope,
                        intercept: memberTrend.intercept,
                        rSquared: memberTrend.rSquared,
                        direction: memberTrend.slope > 0 ? 'increasing' : memberTrend.slope < 0 ? 'decreasing' : 'stable'
                    }
                },
                correlations: {
                    revenueAssets: Math.round(revenueAssetCorrelation * 1000) / 1000,
                    revenueMembers: Math.round(revenueMemberCorrelation * 1000) / 1000
                },
                anomalies: {
                    revenue: revenueAnomalies,
                    assets: assetAnomalies
                },
                forecasts: {
                    revenue: revenueForecast,
                    assets: assetForecast,
                    members: memberForecast
                },
                calculatedAt: new Date(),
                dataPoints: sortedData.length
            };
            
            this.setCache(cacheKey, result);
            this.trackCalculationPerformance('financial_trends', startTime);
            
            return result;
            
        } catch (error) {
            console.error('Failed to calculate financial trends:', error);
            throw error;
        }
    }

    /**
     * Calculate transaction trends and patterns
     * @param {Array} transactionHistory - Array of transaction data over time
     * @returns {Promise<Object>} Transaction trend analysis
     */
    async calculateTransactionTrends(transactionHistory) {
        const cacheKey = `transaction_trends_${this.hashObject(transactionHistory)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const startTime = performance.now();
        
        try {
            if (!Array.isArray(transactionHistory) || transactionHistory.length === 0) {
                throw new Error('Transaction history must be a non-empty array');
            }
            
            // Group transactions by time period
            const monthlyData = this.groupTransactionsByMonth(transactionHistory);
            const dailyData = this.groupTransactionsByDay(transactionHistory);
            
            // Calculate volume trends
            const volumeTrend = this.calculateLinearTrend(monthlyData.map(d => d.count));
            const valueTrend = this.calculateLinearTrend(monthlyData.map(d => d.totalValue));
            
            // Calculate seasonal patterns
            const seasonalPatterns = this.calculateSeasonalPatterns(monthlyData);
            
            // Detect transaction anomalies
            const volumeAnomalies = this.detectAnomalies(monthlyData.map(d => d.count));
            const valueAnomalies = this.detectAnomalies(monthlyData.map(d => d.totalValue));
            
            // Calculate peak transaction times
            const peakHours = this.calculatePeakTransactionTimes(transactionHistory);
            const peakDays = this.calculatePeakTransactionDays(dailyData);
            
            const result = {
                trends: {
                    volume: {
                        slope: volumeTrend.slope,
                        direction: volumeTrend.slope > 0 ? 'increasing' : volumeTrend.slope < 0 ? 'decreasing' : 'stable',
                        rSquared: volumeTrend.rSquared
                    },
                    value: {
                        slope: valueTrend.slope,
                        direction: valueTrend.slope > 0 ? 'increasing' : valueTrend.slope < 0 ? 'decreasing' : 'stable',
                        rSquared: valueTrend.rSquared
                    }
                },
                patterns: {
                    seasonal: seasonalPatterns,
                    peakHours: peakHours,
                    peakDays: peakDays
                },
                anomalies: {
                    volume: volumeAnomalies,
                    value: valueAnomalies
                },
                statistics: {
                    totalTransactions: transactionHistory.length,
                    averageMonthlyVolume: monthlyData.reduce((sum, d) => sum + d.count, 0) / monthlyData.length,
                    averageMonthlyValue: monthlyData.reduce((sum, d) => sum + d.totalValue, 0) / monthlyData.length,
                    monthsAnalyzed: monthlyData.length
                },
                calculatedAt: new Date()
            };
            
            this.setCache(cacheKey, result);
            this.trackCalculationPerformance('transaction_trends', startTime);
            
            return result;
            
        } catch (error) {
            console.error('Failed to calculate transaction trends:', error);
            throw error;
        }
    }

    /**
     * Calculate transaction averages and distributions
     * @param {Array} transactions - Array of transaction data
     * @returns {Promise<Object>} Transaction averages and distribution analysis
     */
    async calculateTransactionAverages(transactions) {
        const cacheKey = `transaction_averages_${this.hashObject(transactions)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const startTime = performance.now();
        
        try {
            if (!Array.isArray(transactions) || transactions.length === 0) {
                return {
                    averages: { value: 0, count: 0 },
                    distribution: { percentiles: {}, histogram: [] },
                    calculatedAt: new Date()
                };
            }
            
            const values = transactions.map(t => t.amount || t.value || 0).filter(v => v > 0);
            
            if (values.length === 0) {
                return {
                    averages: { value: 0, count: 0 },
                    distribution: { percentiles: {}, histogram: [] },
                    calculatedAt: new Date()
                };
            }
            
            // Calculate basic statistics
            const sortedValues = values.sort((a, b) => a - b);
            const sum = values.reduce((acc, val) => acc + val, 0);
            const mean = sum / values.length;
            const median = this.calculateMedian(sortedValues);
            const mode = this.calculateMode(values);
            const standardDeviation = this.calculateStandardDeviation(values, mean);
            
            // Calculate percentiles
            const percentiles = {
                p10: this.calculatePercentile(sortedValues, 10),
                p25: this.calculatePercentile(sortedValues, 25),
                p50: median,
                p75: this.calculatePercentile(sortedValues, 75),
                p90: this.calculatePercentile(sortedValues, 90),
                p95: this.calculatePercentile(sortedValues, 95),
                p99: this.calculatePercentile(sortedValues, 99)
            };
            
            // Create histogram
            const histogram = this.createHistogram(values, 10);
            
            // Calculate distribution metrics
            const skewness = this.calculateSkewness(values, mean, standardDeviation);
            const kurtosis = this.calculateKurtosis(values, mean, standardDeviation);
            
            const result = {
                averages: {
                    mean: Math.round(mean * 100) / 100,
                    median: Math.round(median * 100) / 100,
                    mode: mode,
                    count: values.length
                },
                distribution: {
                    percentiles: percentiles,
                    histogram: histogram,
                    standardDeviation: Math.round(standardDeviation * 100) / 100,
                    skewness: Math.round(skewness * 1000) / 1000,
                    kurtosis: Math.round(kurtosis * 1000) / 1000,
                    range: {
                        min: Math.min(...values),
                        max: Math.max(...values)
                    }
                },
                calculatedAt: new Date()
            };
            
            this.setCache(cacheKey, result);
            this.trackCalculationPerformance('transaction_averages', startTime);
            
            return result;
            
        } catch (error) {
            console.error('Failed to calculate transaction averages:', error);
            throw error;
        }
    }

    // Statistical Analysis Helper Methods

    /**
     * Calculate linear trend using least squares regression
     * @param {Array} data - Array of numeric values
     * @returns {Object} Trend analysis with slope, intercept, and R-squared
     * @private
     */
    calculateLinearTrend(data) {
        if (!Array.isArray(data) || data.length < 2) {
            return { slope: 0, intercept: 0, rSquared: 0 };
        }
        
        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = data;
        
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared
        const yMean = sumY / n;
        const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
        const ssResidual = y.reduce((sum, val, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(val - predicted, 2);
        }, 0);
        
        const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
        
        return {
            slope: Math.round(slope * 1000) / 1000,
            intercept: Math.round(intercept * 100) / 100,
            rSquared: Math.round(rSquared * 1000) / 1000
        };
    }

    /**
     * Calculate correlation coefficient between two datasets
     * @param {Array} x - First dataset
     * @param {Array} y - Second dataset
     * @returns {number} Correlation coefficient (-1 to 1)
     * @private
     */
    calculateCorrelation(x, y) {
        if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
            return 0;
        }
        
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Detect anomalies using statistical methods (Z-score)
     * @param {Array} data - Array of numeric values
     * @param {number} threshold - Z-score threshold (default: 2.5)
     * @returns {Array} Array of anomaly indices and values
     * @private
     */
    detectAnomalies(data, threshold = 2.5) {
        if (!Array.isArray(data) || data.length < 3) {
            return [];
        }
        
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const stdDev = this.calculateStandardDeviation(data, mean);
        
        if (stdDev === 0) return [];
        
        const anomalies = [];
        data.forEach((value, index) => {
            const zScore = Math.abs((value - mean) / stdDev);
            if (zScore > threshold) {
                anomalies.push({
                    index: index,
                    value: value,
                    zScore: Math.round(zScore * 100) / 100,
                    deviation: Math.round((value - mean) * 100) / 100
                });
            }
        });
        
        return anomalies;
    }

    /**
     * Generate forecast using simple linear extrapolation
     * @param {Array} data - Historical data points
     * @param {number} periods - Number of periods to forecast
     * @returns {Array} Forecasted values
     * @private
     */
    generateForecast(data, periods = 3) {
        if (!Array.isArray(data) || data.length < 2 || periods <= 0) {
            return [];
        }
        
        const trend = this.calculateLinearTrend(data);
        const forecast = [];
        const lastIndex = data.length - 1;
        
        for (let i = 1; i <= periods; i++) {
            const forecastValue = trend.slope * (lastIndex + i) + trend.intercept;
            forecast.push({
                period: i,
                value: Math.max(0, Math.round(forecastValue * 100) / 100), // Ensure non-negative
                confidence: Math.max(0.1, trend.rSquared) // Use R-squared as confidence indicator
            });
        }
        
        return forecast;
    }

    /**
     * Calculate standard deviation
     * @param {Array} data - Array of numeric values
     * @param {number} mean - Mean of the data
     * @returns {number} Standard deviation
     * @private
     */
    calculateStandardDeviation(data, mean) {
        if (!Array.isArray(data) || data.length < 2) return 0;
        
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
        return Math.sqrt(variance);
    }

    /**
     * Calculate median of sorted array
     * @param {Array} sortedData - Sorted array of numeric values
     * @returns {number} Median value
     * @private
     */
    calculateMedian(sortedData) {
        if (!Array.isArray(sortedData) || sortedData.length === 0) return 0;
        
        const mid = Math.floor(sortedData.length / 2);
        return sortedData.length % 2 === 0
            ? (sortedData[mid - 1] + sortedData[mid]) / 2
            : sortedData[mid];
    }

    /**
     * Calculate mode (most frequent value)
     * @param {Array} data - Array of numeric values
     * @returns {number} Mode value
     * @private
     */
    calculateMode(data) {
        if (!Array.isArray(data) || data.length === 0) return 0;
        
        const frequency = {};
        let maxFreq = 0;
        let mode = data[0];
        
        data.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
            if (frequency[value] > maxFreq) {
                maxFreq = frequency[value];
                mode = value;
            }
        });
        
        return mode;
    }

    /**
     * Calculate percentile
     * @param {Array} sortedData - Sorted array of numeric values
     * @param {number} percentile - Percentile to calculate (0-100)
     * @returns {number} Percentile value
     * @private
     */
    calculatePercentile(sortedData, percentile) {
        if (!Array.isArray(sortedData) || sortedData.length === 0) return 0;
        
        const index = (percentile / 100) * (sortedData.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) {
            return sortedData[lower];
        }
        
        const weight = index - lower;
        return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    }

    /**
     * Create histogram
     * @param {Array} data - Array of numeric values
     * @param {number} bins - Number of bins
     * @returns {Array} Histogram bins
     * @private
     */
    createHistogram(data, bins = 10) {
        if (!Array.isArray(data) || data.length === 0) return [];
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / bins;
        
        const histogram = Array.from({ length: bins }, (_, i) => ({
            min: min + i * binWidth,
            max: min + (i + 1) * binWidth,
            count: 0,
            percentage: 0
        }));
        
        data.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            histogram[binIndex].count++;
        });
        
        // Calculate percentages
        histogram.forEach(bin => {
            bin.percentage = Math.round((bin.count / data.length) * 10000) / 100;
        });
        
        return histogram;
    }

    /**
     * Calculate skewness
     * @param {Array} data - Array of numeric values
     * @param {number} mean - Mean of the data
     * @param {number} stdDev - Standard deviation
     * @returns {number} Skewness value
     * @private
     */
    calculateSkewness(data, mean, stdDev) {
        if (!Array.isArray(data) || data.length < 3 || stdDev === 0) return 0;
        
        const n = data.length;
        const skewness = data.reduce((sum, val) => {
            return sum + Math.pow((val - mean) / stdDev, 3);
        }, 0) / n;
        
        return skewness;
    }

    /**
     * Calculate kurtosis
     * @param {Array} data - Array of numeric values
     * @param {number} mean - Mean of the data
     * @param {number} stdDev - Standard deviation
     * @returns {number} Kurtosis value
     * @private
     */
    calculateKurtosis(data, mean, stdDev) {
        if (!Array.isArray(data) || data.length < 4 || stdDev === 0) return 0;
        
        const n = data.length;
        const kurtosis = data.reduce((sum, val) => {
            return sum + Math.pow((val - mean) / stdDev, 4);
        }, 0) / n - 3; // Subtract 3 for excess kurtosis
        
        return kurtosis;
    }

    /**
     * Group transactions by month
     * @param {Array} transactions - Array of transaction data
     * @returns {Array} Monthly aggregated data
     * @private
     */
    groupTransactionsByMonth(transactions) {
        const monthlyData = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date || transaction.timestamp || Date.now());
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    count: 0,
                    totalValue: 0,
                    date: new Date(date.getFullYear(), date.getMonth(), 1)
                };
            }
            
            monthlyData[monthKey].count++;
            monthlyData[monthKey].totalValue += transaction.amount || transaction.value || 0;
        });
        
        return Object.values(monthlyData).sort((a, b) => a.date - b.date);
    }

    /**
     * Group transactions by day
     * @param {Array} transactions - Array of transaction data
     * @returns {Array} Daily aggregated data
     * @private
     */
    groupTransactionsByDay(transactions) {
        const dailyData = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date || transaction.timestamp || Date.now());
            const dayKey = date.toISOString().split('T')[0];
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    date: dayKey,
                    count: 0,
                    totalValue: 0,
                    dayOfWeek: date.getDay()
                };
            }
            
            dailyData[dayKey].count++;
            dailyData[dayKey].totalValue += transaction.amount || transaction.value || 0;
        });
        
        return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Calculate seasonal patterns
     * @param {Array} monthlyData - Monthly aggregated data
     * @returns {Object} Seasonal pattern analysis
     * @private
     */
    calculateSeasonalPatterns(monthlyData) {
        if (!Array.isArray(monthlyData) || monthlyData.length < 12) {
            return { quarters: [], months: [], yearOverYear: [] };
        }
        
        // Group by quarters
        const quarters = { Q1: [], Q2: [], Q3: [], Q4: [] };
        const months = Array.from({ length: 12 }, () => []);
        
        monthlyData.forEach(data => {
            const month = new Date(data.date).getMonth();
            const quarter = Math.floor(month / 3);
            const quarterKey = `Q${quarter + 1}`;
            
            quarters[quarterKey].push(data.count);
            months[month].push(data.count);
        });
        
        // Calculate average for each quarter and month
        const quarterlyAverages = Object.keys(quarters).map(quarter => ({
            quarter,
            averageVolume: quarters[quarter].length > 0 
                ? quarters[quarter].reduce((sum, val) => sum + val, 0) / quarters[quarter].length 
                : 0
        }));
        
        const monthlyAverages = months.map((monthData, index) => ({
            month: index + 1,
            monthName: new Date(2000, index, 1).toLocaleString('default', { month: 'long' }),
            averageVolume: monthData.length > 0 
                ? monthData.reduce((sum, val) => sum + val, 0) / monthData.length 
                : 0
        }));
        
        return {
            quarters: quarterlyAverages,
            months: monthlyAverages,
            peakQuarter: quarterlyAverages.reduce((max, q) => q.averageVolume > max.averageVolume ? q : max),
            peakMonth: monthlyAverages.reduce((max, m) => m.averageVolume > max.averageVolume ? m : max)
        };
    }

    /**
     * Calculate peak transaction times (hours)
     * @param {Array} transactions - Array of transaction data
     * @returns {Array} Peak hours analysis
     * @private
     */
    calculatePeakTransactionTimes(transactions) {
        const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date || transaction.timestamp || Date.now());
            const hour = date.getHours();
            hourlyData[hour].count++;
        });
        
        return hourlyData
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // Top 5 peak hours
            .map(data => ({
                hour: data.hour,
                timeRange: `${String(data.hour).padStart(2, '0')}:00-${String(data.hour + 1).padStart(2, '0')}:00`,
                transactionCount: data.count,
                percentage: Math.round((data.count / transactions.length) * 10000) / 100
            }));
    }

    /**
     * Calculate peak transaction days
     * @param {Array} dailyData - Daily aggregated data
     * @returns {Array} Peak days analysis
     * @private
     */
    calculatePeakTransactionDays(dailyData) {
        const dayOfWeekData = Array.from({ length: 7 }, (_, i) => ({ 
            dayOfWeek: i, 
            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
            totalCount: 0,
            days: 0
        }));
        
        dailyData.forEach(data => {
            const dayOfWeek = data.dayOfWeek;
            dayOfWeekData[dayOfWeek].totalCount += data.count;
            dayOfWeekData[dayOfWeek].days++;
        });
        
        return dayOfWeekData
            .map(data => ({
                dayName: data.dayName,
                averageTransactions: data.days > 0 ? Math.round(data.totalCount / data.days) : 0,
                totalDays: data.days
            }))
            .sort((a, b) => b.averageTransactions - a.averageTransactions);
    }

    // Cache Management Methods
    
    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any} Cached value or null
     * @private
     */
    getFromCache(key) {
        const cached = this.calculationCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            this.performanceMetrics.cacheHits++;
            return cached.value;
        }
        this.performanceMetrics.cacheMisses++;
        return null;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @private
     */
    setCache(key, value) {
        this.calculationCache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Setup cache cleanup interval
     * @private
     */
    setupCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, cached] of this.calculationCache.entries()) {
                if (now - cached.timestamp > this.cacheTimeout) {
                    this.calculationCache.delete(key);
                }
            }
        }, this.cacheTimeout);
    }

    /**
     * Hash object for cache key generation
     * @param {Object} obj - Object to hash
     * @returns {string} Hash string
     * @private
     */
    hashObject(obj) {
        return btoa(JSON.stringify(obj)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }

    /**
     * Track calculation performance
     * @param {string} calculationType - Type of calculation
     * @param {number} startTime - Start time
     * @private
     */
    trackCalculationPerformance(calculationType, startTime) {
        const duration = performance.now() - startTime;
        this.performanceMetrics.calculationTimes.push({
            type: calculationType,
            duration,
            timestamp: Date.now()
        });
        this.performanceMetrics.totalCalculations++;
    }

    /**
     * Get analytics engine performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const calculations = this.performanceMetrics.calculationTimes;
        const avgCalculationTime = calculations.length > 0
            ? calculations.reduce((sum, calc) => sum + calc.duration, 0) / calculations.length
            : 0;
        
        const cacheHitRate = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0
            ? this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)
            : 0;
        
        return {
            totalCalculations: this.performanceMetrics.totalCalculations,
            averageCalculationTime: Math.round(avgCalculationTime * 100) / 100,
            cacheHitRate: Math.round(cacheHitRate * 10000) / 100,
            cacheSize: this.calculationCache.size,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.calculationCache.clear();
        this.dataCache.clear();
    }

    /**
     * Destroy analytics engine and cleanup resources
     */
    destroy() {
        this.clearCache();
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsEngine };
} else {
    window.AnalyticsEngine = AnalyticsEngine;
}