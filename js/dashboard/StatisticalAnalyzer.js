/**
 * Dashboard Analytics & KPI - Statistical Analyzer
 * 
 * Advanced statistical analysis tools for correlation analysis, regression analysis,
 * and automated insight generation algorithms.
 */

class StatisticalAnalyzer {
    constructor(analyticsEngine) {
        this.analyticsEngine = analyticsEngine;
        this.correlationCache = new Map();
        this.regressionCache = new Map();
        this.insightCache = new Map();
        
        // Statistical constants
        this.CORRELATION_THRESHOLD = 0.5;
        this.SIGNIFICANCE_LEVEL = 0.05;
        this.MIN_DATA_POINTS = 5;
        this.MAX_CACHE_SIZE = 100;
        
        // Initialize insight templates
        this.initializeInsightTemplates();
    }

    /**
     * Initialize insight generation templates
     */
    initializeInsightTemplates() {
        this.insightTemplates = {
            correlation: {
                strong_positive: "Strong positive correlation ({correlation}) detected between {metric1} and {metric2}. When {metric1} increases, {metric2} tends to increase significantly.",
                strong_negative: "Strong negative correlation ({correlation}) detected between {metric1} and {metric2}. When {metric1} increases, {metric2} tends to decrease significantly.",
                moderate_positive: "Moderate positive correlation ({correlation}) found between {metric1} and {metric2}. There's a noticeable relationship worth monitoring.",
                moderate_negative: "Moderate negative correlation ({correlation}) found between {metric1} and {metric2}. There's an inverse relationship worth monitoring.",
                weak: "Weak correlation ({correlation}) between {metric1} and {metric2}. No significant relationship detected."
            },
            trend: {
                strong_growth: "{metric} shows strong growth trend with {rate}% increase over the period. This indicates excellent performance.",
                moderate_growth: "{metric} shows moderate growth with {rate}% increase. Performance is positive but could be optimized.",
                stable: "{metric} remains stable with minimal change ({rate}%). Consider strategies to drive growth.",
                moderate_decline: "{metric} shows concerning decline of {rate}%. Immediate attention recommended.",
                strong_decline: "{metric} shows significant decline of {rate}%. Urgent intervention required."
            },
            anomaly: {
                spike: "Unusual spike detected in {metric} on {date}. Value {value} is {deviation} standard deviations above normal.",
                drop: "Unusual drop detected in {metric} on {date}. Value {value} is {deviation} standard deviations below normal.",
                pattern_break: "Pattern break detected in {metric}. Expected trend disrupted around {date}.",
                volatility: "Increased volatility detected in {metric}. Standard deviation increased by {change}% from baseline."
            }
        };
    }

    /**
     * Perform comprehensive correlation analysis between multiple metrics
     * @param {Array} datasets - Array of dataset objects with {name, data} structure
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Correlation analysis results
     */
    async performCorrelationAnalysis(datasets, options = {}) {
        try {
            const {
                method = 'pearson',
                threshold = this.CORRELATION_THRESHOLD,
                includeInsights = true,
                cacheResults = true
            } = options;

            // Generate cache key
            const cacheKey = this.generateCacheKey('correlation', datasets, options);
            
            // Check cache first
            if (cacheResults && this.correlationCache.has(cacheKey)) {
                return this.correlationCache.get(cacheKey);
            }

            // Validate input data
            this.validateDatasets(datasets);

            const results = {
                method: method,
                threshold: threshold,
                correlations: [],
                matrix: {},
                summary: {},
                insights: [],
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
                        significance: correlation.pValue < this.SIGNIFICANCE_LEVEL ? 'significant' : 'not_significant',
                        strength: this.classifyCorrelationStrength(Math.abs(correlation.coefficient)),
                        direction: correlation.coefficient > 0 ? 'positive' : 'negative',
                        sampleSize: correlation.sampleSize
                    };

                    results.correlations.push(correlationResult);
                    
                    // Update matrix (symmetric)
                    results.matrix[dataset1.name][dataset2.name] = correlation.coefficient;
                    results.matrix[dataset2.name][dataset1.name] = correlation.coefficient;
                }
                
                // Self-correlation is always 1
                results.matrix[datasets[i].name][datasets[i].name] = 1.0;
            }

            // Generate summary statistics
            results.summary = this.generateCorrelationSummary(results.correlations, threshold);

            // Generate insights if requested
            if (includeInsights) {
                results.insights = this.generateCorrelationInsights(results.correlations);
            }

            // Cache results
            if (cacheResults) {
                this.addToCache(this.correlationCache, cacheKey, results);
            }

            return results;

        } catch (error) {
            console.error('Correlation analysis failed:', error);
            throw new Error(`Correlation analysis failed: ${error.message}`);
        }
    }

    /**
     * Perform regression analysis for trend prediction
     * @param {Array} data - Time series data with x (time) and y (value) properties
     * @param {Object} options - Regression options
     * @returns {Promise<Object>} Regression analysis results
     */
    async performRegressionAnalysis(data, options = {}) {
        try {
            const {
                method = 'linear',
                predictPeriods = 3,
                confidenceLevel = 0.95,
                includeResiduals = true,
                cacheResults = true
            } = options;

            // Generate cache key
            const cacheKey = this.generateCacheKey('regression', data, options);
            
            // Check cache first
            if (cacheResults && this.regressionCache.has(cacheKey)) {
                return this.regressionCache.get(cacheKey);
            }

            // Validate input data
            this.validateTimeSeriesData(data);

            const results = {
                method: method,
                model: {},
                predictions: [],
                statistics: {},
                residuals: [],
                insights: [],
                metadata: {
                    analyzedAt: new Date(),
                    dataPoints: data.length,
                    predictPeriods: predictPeriods
                }
            };

            // Perform regression based on method
            switch (method) {
                case 'linear':
                    results.model = await this.performLinearRegression(data);
                    break;
                case 'polynomial':
                    results.model = await this.performPolynomialRegression(data, options.degree || 2);
                    break;
                case 'exponential':
                    results.model = await this.performExponentialRegression(data);
                    break;
                default:
                    throw new Error(`Unsupported regression method: ${method}`);
            }

            // Calculate model statistics
            results.statistics = this.calculateRegressionStatistics(data, results.model);

            // Generate predictions
            results.predictions = this.generatePredictions(data, results.model, predictPeriods);

            // Calculate residuals if requested
            if (includeResiduals) {
                results.residuals = this.calculateResiduals(data, results.model);
            }

            // Generate insights
            results.insights = this.generateRegressionInsights(results);

            // Cache results
            if (cacheResults) {
                this.addToCache(this.regressionCache, cacheKey, results);
            }

            return results;

        } catch (error) {
            console.error('Regression analysis failed:', error);
            throw new Error(`Regression analysis failed: ${error.message}`);
        }
    }

    /**
     * Generate automated insights from data patterns
     * @param {Array} datasets - Array of dataset objects
     * @param {Object} options - Insight generation options
     * @returns {Promise<Object>} Generated insights
     */
    async generateAutomatedInsights(datasets, options = {}) {
        try {
            const {
                includeCorrelations = true,
                includeTrends = true,
                includeAnomalies = true,
                insightLimit = 10,
                cacheResults = true
            } = options;

            // Generate cache key
            const cacheKey = this.generateCacheKey('insights', datasets, options);
            
            // Check cache first
            if (cacheResults && this.insightCache.has(cacheKey)) {
                return this.insightCache.get(cacheKey);
            }

            const insights = {
                correlations: [],
                trends: [],
                anomalies: [],
                summary: {},
                recommendations: [],
                metadata: {
                    generatedAt: new Date(),
                    datasetCount: datasets.length,
                    analysisTypes: []
                }
            };

            // Correlation insights
            if (includeCorrelations && datasets.length > 1) {
                insights.metadata.analysisTypes.push('correlation');
                const correlationResults = await this.performCorrelationAnalysis(datasets, {
                    includeInsights: false,
                    cacheResults: false
                });
                insights.correlations = this.generateCorrelationInsights(correlationResults.correlations);
            }

            // Trend insights
            if (includeTrends) {
                insights.metadata.analysisTypes.push('trend');
                for (const dataset of datasets) {
                    const trendInsights = await this.analyzeTrends(dataset);
                    insights.trends.push(...trendInsights);
                }
            }

            // Anomaly insights
            if (includeAnomalies) {
                insights.metadata.analysisTypes.push('anomaly');
                for (const dataset of datasets) {
                    const anomalyInsights = await this.detectAnomalies(dataset);
                    insights.anomalies.push(...anomalyInsights);
                }
            }

            // Generate summary and recommendations
            insights.summary = this.generateInsightSummary(insights);
            insights.recommendations = this.generateRecommendations(insights);

            // Limit insights if specified
            if (insightLimit > 0) {
                insights.correlations = insights.correlations.slice(0, insightLimit);
                insights.trends = insights.trends.slice(0, insightLimit);
                insights.anomalies = insights.anomalies.slice(0, insightLimit);
            }

            // Cache results
            if (cacheResults) {
                this.addToCache(this.insightCache, cacheKey, insights);
            }

            return insights;

        } catch (error) {
            console.error('Automated insight generation failed:', error);
            throw new Error(`Insight generation failed: ${error.message}`);
        }
    }

    /**
     * Calculate Pearson correlation coefficient with significance testing
     * @param {Array} data1 - First dataset
     * @param {Array} data2 - Second dataset
     * @param {string} method - Correlation method
     * @returns {Promise<Object>} Correlation results
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

        // Calculate p-value for significance testing
        const pValue = this.calculateCorrelationPValue(coefficient, alignedData.length);

        return {
            coefficient: coefficient,
            pValue: pValue,
            sampleSize: alignedData.length,
            method: method
        };
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
     * Perform linear regression analysis
     * @param {Array} data - Time series data
     * @returns {Object} Linear regression model
     */
    async performLinearRegression(data) {
        const n = data.length;
        const sumX = data.reduce((sum, point) => sum + point.x, 0);
        const sumY = data.reduce((sum, point) => sum + point.y, 0);
        const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
        const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return {
            type: 'linear',
            slope: slope,
            intercept: intercept,
            equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
            predict: (x) => slope * x + intercept
        };
    }

    /**
     * Perform polynomial regression analysis
     * @param {Array} data - Time series data
     * @param {number} degree - Polynomial degree
     * @returns {Object} Polynomial regression model
     */
    async performPolynomialRegression(data, degree = 2) {
        // For simplicity, implement quadratic regression (degree 2)
        if (degree !== 2) {
            throw new Error('Only quadratic polynomial regression (degree 2) is currently supported');
        }

        const n = data.length;
        const x = data.map(point => point.x);
        const y = data.map(point => point.y);

        // Create design matrix for quadratic regression
        const X = [];
        for (let i = 0; i < n; i++) {
            X.push([1, x[i], x[i] * x[i]]);
        }

        // Solve normal equations using matrix operations (simplified)
        const coefficients = this.solveNormalEquations(X, y);

        return {
            type: 'polynomial',
            degree: degree,
            coefficients: coefficients,
            equation: `y = ${coefficients[2].toFixed(4)}x² + ${coefficients[1].toFixed(4)}x + ${coefficients[0].toFixed(4)}`,
            predict: (x) => coefficients[0] + coefficients[1] * x + coefficients[2] * x * x
        };
    }

    /**
     * Perform exponential regression analysis
     * @param {Array} data - Time series data
     * @returns {Object} Exponential regression model
     */
    async performExponentialRegression(data) {
        // Transform to linear: ln(y) = ln(a) + bx
        const transformedData = data
            .filter(point => point.y > 0) // Exponential requires positive values
            .map(point => ({ x: point.x, y: Math.log(point.y) }));

        if (transformedData.length < this.MIN_DATA_POINTS) {
            throw new Error('Insufficient positive data points for exponential regression');
        }

        const linearModel = await this.performLinearRegression(transformedData);
        const a = Math.exp(linearModel.intercept);
        const b = linearModel.slope;

        return {
            type: 'exponential',
            a: a,
            b: b,
            equation: `y = ${a.toFixed(4)} * e^(${b.toFixed(4)}x)`,
            predict: (x) => a * Math.exp(b * x)
        };
    }

    /**
     * Solve normal equations for polynomial regression (simplified)
     * @param {Array} X - Design matrix
     * @param {Array} y - Target values
     * @returns {Array} Coefficients
     */
    solveNormalEquations(X, y) {
        // Simplified solution for quadratic case
        const n = X.length;
        const sumX0 = n;
        const sumX1 = X.reduce((sum, row) => sum + row[1], 0);
        const sumX2 = X.reduce((sum, row) => sum + row[2], 0);
        const sumX3 = X.reduce((sum, row) => sum + row[1] * row[2], 0);
        const sumX4 = X.reduce((sum, row) => sum + row[2] * row[2], 0);
        
        const sumY = y.reduce((sum, yi) => sum + yi, 0);
        const sumXY = y.reduce((sum, yi, i) => sum + yi * X[i][1], 0);
        const sumX2Y = y.reduce((sum, yi, i) => sum + yi * X[i][2], 0);

        // Solve 3x3 system (simplified Cramer's rule)
        const det = sumX0 * (sumX2 * sumX4 - sumX3 * sumX3) - 
                   sumX1 * (sumX1 * sumX4 - sumX2 * sumX3) + 
                   sumX2 * (sumX1 * sumX3 - sumX2 * sumX2);

        if (Math.abs(det) < 1e-10) {
            throw new Error('Matrix is singular, cannot solve normal equations');
        }

        const a = (sumY * (sumX2 * sumX4 - sumX3 * sumX3) - 
                  sumXY * (sumX1 * sumX4 - sumX2 * sumX3) + 
                  sumX2Y * (sumX1 * sumX3 - sumX2 * sumX2)) / det;

        const b = (sumX0 * (sumXY * sumX4 - sumX2Y * sumX3) - 
                  sumY * (sumX1 * sumX4 - sumX2 * sumX3) + 
                  sumX2 * (sumX1 * sumX2Y - sumXY * sumX2)) / det;

        const c = (sumX0 * (sumX2 * sumX2Y - sumX3 * sumXY) - 
                  sumX1 * (sumX1 * sumX2Y - sumX2 * sumXY) + 
                  sumY * (sumX1 * sumX3 - sumX2 * sumX2)) / det;

        return [a, b, c];
    }

    /**
     * Calculate regression statistics
     * @param {Array} data - Original data
     * @param {Object} model - Regression model
     * @returns {Object} Statistics
     */
    calculateRegressionStatistics(data, model) {
        const predictions = data.map(point => model.predict(point.x));
        const actual = data.map(point => point.y);
        
        // Calculate R-squared
        const meanY = actual.reduce((sum, y) => sum + y, 0) / actual.length;
        const totalSumSquares = actual.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
        const residualSumSquares = actual.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
        const rSquared = 1 - (residualSumSquares / totalSumSquares);

        // Calculate standard error
        const standardError = Math.sqrt(residualSumSquares / (data.length - 2));

        // Calculate mean absolute error
        const mae = actual.reduce((sum, y, i) => sum + Math.abs(y - predictions[i]), 0) / actual.length;

        // Calculate root mean square error
        const rmse = Math.sqrt(residualSumSquares / actual.length);

        return {
            rSquared: rSquared,
            adjustedRSquared: 1 - ((1 - rSquared) * (data.length - 1)) / (data.length - 2),
            standardError: standardError,
            meanAbsoluteError: mae,
            rootMeanSquareError: rmse,
            residualSumSquares: residualSumSquares,
            totalSumSquares: totalSumSquares
        };
    }

    /**
     * Generate predictions using regression model
     * @param {Array} data - Historical data
     * @param {Object} model - Regression model
     * @param {number} periods - Number of periods to predict
     * @returns {Array} Predictions
     */
    generatePredictions(data, model, periods) {
        const predictions = [];
        const lastPoint = data[data.length - 1];
        const timeStep = data.length > 1 ? data[1].x - data[0].x : 1;

        for (let i = 1; i <= periods; i++) {
            const futureX = lastPoint.x + (timeStep * i);
            const predictedY = model.predict(futureX);
            
            predictions.push({
                x: futureX,
                y: predictedY,
                period: i,
                confidence: this.calculatePredictionConfidence(i, periods)
            });
        }

        return predictions;
    }

    /**
     * Calculate prediction confidence (decreases with distance)
     * @param {number} period - Prediction period
     * @param {number} totalPeriods - Total prediction periods
     * @returns {number} Confidence level (0-1)
     */
    calculatePredictionConfidence(period, totalPeriods) {
        // Simple confidence decay function
        return Math.max(0.1, 1 - (period - 1) / totalPeriods * 0.8);
    }

    /**
     * Calculate residuals for regression model
     * @param {Array} data - Original data
     * @param {Object} model - Regression model
     * @returns {Array} Residuals
     */
    calculateResiduals(data, model) {
        return data.map(point => {
            const predicted = model.predict(point.x);
            const residual = point.y - predicted;
            
            return {
                x: point.x,
                actual: point.y,
                predicted: predicted,
                residual: residual,
                standardizedResidual: residual // Would need standard error for proper standardization
            };
        });
    }

    /**
     * Analyze trends in dataset
     * @param {Object} dataset - Dataset with name and data
     * @returns {Promise<Array>} Trend insights
     */
    async analyzeTrends(dataset) {
        const insights = [];
        
        if (!dataset.data || dataset.data.length < this.MIN_DATA_POINTS) {
            return insights;
        }

        try {
            // Perform linear regression to detect overall trend
            const regression = await this.performRegressionAnalysis(dataset.data, {
                method: 'linear',
                cacheResults: false
            });

            const slope = regression.model.slope;
            const rSquared = regression.statistics.rSquared;
            
            // Calculate growth rate
            const firstValue = dataset.data[0].y;
            const lastValue = dataset.data[dataset.data.length - 1].y;
            const growthRate = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;

            // Classify trend strength
            let trendType;
            if (Math.abs(growthRate) > 20) {
                trendType = Math.abs(growthRate) > 50 ? 'strong' : 'moderate';
            } else {
                trendType = 'stable';
            }

            const direction = growthRate > 0 ? 'growth' : growthRate < 0 ? 'decline' : 'stable';
            const templateKey = `${trendType}_${direction}`;

            if (this.insightTemplates.trend[templateKey]) {
                const insight = {
                    type: 'trend',
                    metric: dataset.name,
                    message: this.insightTemplates.trend[templateKey]
                        .replace('{metric}', dataset.name)
                        .replace('{rate}', Math.abs(growthRate).toFixed(1)),
                    severity: this.getTrendSeverity(trendType, direction),
                    confidence: rSquared,
                    data: {
                        growthRate: growthRate,
                        slope: slope,
                        rSquared: rSquared,
                        trendType: trendType,
                        direction: direction
                    }
                };

                insights.push(insight);
            }

        } catch (error) {
            console.warn(`Trend analysis failed for ${dataset.name}:`, error);
        }

        return insights;
    }

    /**
     * Detect anomalies in dataset
     * @param {Object} dataset - Dataset with name and data
     * @returns {Promise<Array>} Anomaly insights
     */
    async detectAnomalies(dataset) {
        const insights = [];
        
        if (!dataset.data || dataset.data.length < this.MIN_DATA_POINTS) {
            return insights;
        }

        try {
            const values = dataset.data.map(point => point.y);
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

            // Z-score threshold for anomaly detection (typically 2 or 3)
            const threshold = 2.5;

            for (let i = 0; i < dataset.data.length; i++) {
                const point = dataset.data[i];
                const zScore = Math.abs((point.y - mean) / stdDev);

                if (zScore > threshold) {
                    const anomalyType = point.y > mean ? 'spike' : 'drop';
                    const templateKey = anomalyType;

                    if (this.insightTemplates.anomaly[templateKey]) {
                        const insight = {
                            type: 'anomaly',
                            metric: dataset.name,
                            message: this.insightTemplates.anomaly[templateKey]
                                .replace('{metric}', dataset.name)
                                .replace('{date}', this.formatDate(point.x))
                                .replace('{value}', point.y.toLocaleString())
                                .replace('{deviation}', zScore.toFixed(1)),
                            severity: zScore > 3 ? 'high' : 'medium',
                            confidence: Math.min(0.95, zScore / 4), // Higher z-score = higher confidence
                            data: {
                                point: point,
                                zScore: zScore,
                                mean: mean,
                                stdDev: stdDev,
                                anomalyType: anomalyType
                            }
                        };

                        insights.push(insight);
                    }
                }
            }

        } catch (error) {
            console.warn(`Anomaly detection failed for ${dataset.name}:`, error);
        }

        return insights;
    }

    /**
     * Generate correlation insights from correlation results
     * @param {Array} correlations - Correlation results
     * @returns {Array} Correlation insights
     */
    generateCorrelationInsights(correlations) {
        const insights = [];

        for (const correlation of correlations) {
            if (Math.abs(correlation.coefficient) >= this.CORRELATION_THRESHOLD) {
                const strength = correlation.strength;
                const direction = correlation.direction;
                const templateKey = `${strength}_${direction}`;

                if (this.insightTemplates.correlation[templateKey]) {
                    const insight = {
                        type: 'correlation',
                        metrics: [correlation.metric1, correlation.metric2],
                        message: this.insightTemplates.correlation[templateKey]
                            .replace('{correlation}', correlation.coefficient.toFixed(3))
                            .replace('{metric1}', correlation.metric1)
                            .replace('{metric2}', correlation.metric2),
                        severity: strength === 'strong' ? 'high' : 'medium',
                        confidence: 1 - correlation.pValue, // Higher confidence for lower p-value
                        data: correlation
                    };

                    insights.push(insight);
                }
            }
        }

        return insights;
    }

    /**
     * Generate regression insights
     * @param {Object} regressionResults - Regression analysis results
     * @returns {Array} Regression insights
     */
    generateRegressionInsights(regressionResults) {
        const insights = [];
        const { model, statistics, predictions } = regressionResults;

        // Model fit insight
        if (statistics.rSquared > 0.7) {
            insights.push({
                type: 'regression',
                message: `Strong predictive model identified with ${(statistics.rSquared * 100).toFixed(1)}% variance explained. Model is reliable for forecasting.`,
                severity: 'high',
                confidence: statistics.rSquared,
                data: { type: 'model_fit', rSquared: statistics.rSquared }
            });
        } else if (statistics.rSquared > 0.4) {
            insights.push({
                type: 'regression',
                message: `Moderate predictive model with ${(statistics.rSquared * 100).toFixed(1)}% variance explained. Use predictions with caution.`,
                severity: 'medium',
                confidence: statistics.rSquared,
                data: { type: 'model_fit', rSquared: statistics.rSquared }
            });
        }

        // Prediction insights
        if (predictions.length > 0) {
            const avgPrediction = predictions.reduce((sum, pred) => sum + pred.y, 0) / predictions.length;
            const trend = model.slope > 0 ? 'increasing' : model.slope < 0 ? 'decreasing' : 'stable';
            
            insights.push({
                type: 'regression',
                message: `Forecast shows ${trend} trend with average predicted value of ${avgPrediction.toFixed(2)} over next ${predictions.length} periods.`,
                severity: 'medium',
                confidence: predictions[0].confidence,
                data: { type: 'forecast', predictions: predictions, trend: trend }
            });
        }

        return insights;
    }

    // Helper methods

    /**
     * Classify correlation strength
     * @param {number} coefficient - Absolute correlation coefficient
     * @returns {string} Strength classification
     */
    classifyCorrelationStrength(coefficient) {
        if (coefficient >= 0.8) return 'strong';
        if (coefficient >= 0.5) return 'moderate';
        return 'weak';
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
     * Get trend severity based on type and direction
     * @param {string} trendType - Trend type (strong, moderate, stable)
     * @param {string} direction - Trend direction (growth, decline, stable)
     * @returns {string} Severity level
     */
    getTrendSeverity(trendType, direction) {
        if (direction === 'decline' && trendType === 'strong') return 'high';
        if (direction === 'decline' && trendType === 'moderate') return 'medium';
        if (direction === 'growth' && trendType === 'strong') return 'high';
        return 'low';
    }

    /**
     * Format date for display
     * @param {*} date - Date value
     * @returns {string} Formatted date
     */
    formatDate(date) {
        if (date instanceof Date) {
            return date.toLocaleDateString();
        }
        if (typeof date === 'string') {
            return new Date(date).toLocaleDateString();
        }
        return String(date);
    }

    /**
     * Validate datasets for analysis
     * @param {Array} datasets - Datasets to validate
     * @throws {Error} If validation fails
     */
    validateDatasets(datasets) {
        if (!Array.isArray(datasets) || datasets.length === 0) {
            throw new Error('Datasets must be a non-empty array');
        }

        for (const dataset of datasets) {
            if (!dataset.name || !Array.isArray(dataset.data)) {
                throw new Error('Each dataset must have a name and data array');
            }
            
            if (dataset.data.length < this.MIN_DATA_POINTS) {
                throw new Error(`Dataset ${dataset.name} has insufficient data points (${dataset.data.length} < ${this.MIN_DATA_POINTS})`);
            }
        }
    }

    /**
     * Validate time series data
     * @param {Array} data - Time series data
     * @throws {Error} If validation fails
     */
    validateTimeSeriesData(data) {
        if (!Array.isArray(data) || data.length < this.MIN_DATA_POINTS) {
            throw new Error(`Insufficient data points for analysis (${data.length} < ${this.MIN_DATA_POINTS})`);
        }

        for (const point of data) {
            if (typeof point.x === 'undefined' || typeof point.y === 'undefined') {
                throw new Error('Time series data must have x and y properties');
            }
            
            if (typeof point.y !== 'number' || isNaN(point.y)) {
                throw new Error('Y values must be valid numbers');
            }
        }
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
     * Generate cache key for results
     * @param {string} type - Analysis type
     * @param {*} data - Input data
     * @param {Object} options - Analysis options
     * @returns {string} Cache key
     */
    generateCacheKey(type, data, options) {
        const dataHash = JSON.stringify(data).slice(0, 100); // Simplified hash
        const optionsHash = JSON.stringify(options);
        return `${type}_${btoa(dataHash + optionsHash).slice(0, 20)}`;
    }

    /**
     * Add result to cache with size management
     * @param {Map} cache - Cache map
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    addToCache(cache, key, value) {
        if (cache.size >= this.MAX_CACHE_SIZE) {
            // Remove oldest entry (simple FIFO)
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        cache.set(key, value);
    }

    /**
     * Generate correlation summary statistics
     * @param {Array} correlations - Correlation results
     * @param {number} threshold - Significance threshold
     * @returns {Object} Summary statistics
     */
    generateCorrelationSummary(correlations, threshold) {
        const significant = correlations.filter(c => Math.abs(c.coefficient) >= threshold);
        const strong = correlations.filter(c => Math.abs(c.coefficient) >= 0.8);
        const positive = correlations.filter(c => c.coefficient > 0);
        const negative = correlations.filter(c => c.coefficient < 0);

        return {
            totalCorrelations: correlations.length,
            significantCorrelations: significant.length,
            strongCorrelations: strong.length,
            positiveCorrelations: positive.length,
            negativeCorrelations: negative.length,
            averageCorrelation: correlations.reduce((sum, c) => sum + Math.abs(c.coefficient), 0) / correlations.length,
            maxCorrelation: Math.max(...correlations.map(c => Math.abs(c.coefficient))),
            minCorrelation: Math.min(...correlations.map(c => Math.abs(c.coefficient)))
        };
    }

    /**
     * Generate insight summary
     * @param {Object} insights - Generated insights
     * @returns {Object} Summary
     */
    generateInsightSummary(insights) {
        return {
            totalInsights: insights.correlations.length + insights.trends.length + insights.anomalies.length,
            correlationInsights: insights.correlations.length,
            trendInsights: insights.trends.length,
            anomalyInsights: insights.anomalies.length,
            highSeverityInsights: [
                ...insights.correlations,
                ...insights.trends,
                ...insights.anomalies
            ].filter(insight => insight.severity === 'high').length
        };
    }

    /**
     * Generate recommendations based on insights
     * @param {Object} insights - Generated insights
     * @returns {Array} Recommendations
     */
    generateRecommendations(insights) {
        const recommendations = [];

        // High severity anomalies
        const highAnomalies = insights.anomalies.filter(a => a.severity === 'high');
        if (highAnomalies.length > 0) {
            recommendations.push({
                type: 'urgent',
                message: `${highAnomalies.length} critical anomalies detected. Immediate investigation recommended.`,
                priority: 'high',
                actions: ['Investigate root causes', 'Implement corrective measures', 'Monitor closely']
            });
        }

        // Strong correlations
        const strongCorrelations = insights.correlations.filter(c => c.severity === 'high');
        if (strongCorrelations.length > 0) {
            recommendations.push({
                type: 'optimization',
                message: `${strongCorrelations.length} strong correlations found. Consider leveraging these relationships for optimization.`,
                priority: 'medium',
                actions: ['Analyze causal relationships', 'Develop optimization strategies', 'Monitor correlation stability']
            });
        }

        // Declining trends
        const decliningTrends = insights.trends.filter(t => t.data && t.data.direction === 'decline');
        if (decliningTrends.length > 0) {
            recommendations.push({
                type: 'improvement',
                message: `${decliningTrends.length} declining trends identified. Action needed to reverse negative patterns.`,
                priority: 'medium',
                actions: ['Identify decline causes', 'Implement improvement plans', 'Set monitoring alerts']
            });
        }

        return recommendations;
    }

    /**
     * Clear all caches
     */
    clearCaches() {
        this.correlationCache.clear();
        this.regressionCache.clear();
        this.insightCache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            correlationCacheSize: this.correlationCache.size,
            regressionCacheSize: this.regressionCache.size,
            insightCacheSize: this.insightCache.size,
            totalCacheSize: this.correlationCache.size + this.regressionCache.size + this.insightCache.size,
            maxCacheSize: this.MAX_CACHE_SIZE
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticalAnalyzer;
} else if (typeof window !== 'undefined') {
    window.StatisticalAnalyzer = StatisticalAnalyzer;
}