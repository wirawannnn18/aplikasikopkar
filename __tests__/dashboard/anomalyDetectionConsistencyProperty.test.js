/**
 * Property-based tests for anomaly detection consistency
 * Tests the mathematical properties and behavioral consistency of the anomaly detection system
 */

const fc = require('fast-check');

// Mock AnomalyDetector for testing
class AnomalyDetector {
    constructor(options = {}) {
        this.config = {
            zScoreThreshold: options.zScoreThreshold || 2.5,
            iqrMultiplier: options.iqrMultiplier || 1.5,
            trendChangeThreshold: options.trendChangeThreshold || 0.2,
            minDataPoints: options.minDataPoints || 10,
            alertCooldown: options.alertCooldown || 300000,
            ...options
        };
        
        this.alertHistory = new Map();
        this.thresholds = new Map();
        this.subscribers = new Map();
        
        this.initializeDefaultThresholds();
    }

    initializeDefaultThresholds() {
        const defaultThresholds = {
            'financial_health_score': { min: 30, max: 100, critical: 20 },
            'member_growth_rate': { min: -0.05, max: 1.0, critical: -0.15 },
            'transaction_volume': { min: 0, max: null, critical: null },
            'cash_balance': { min: 1000000, max: null, critical: 500000 },
            'loan_default_rate': { min: 0, max: 0.05, critical: 0.10 },
            'savings_growth_rate': { min: 0, max: 1.0, critical: -0.10 }
        };

        for (const [metric, threshold] of Object.entries(defaultThresholds)) {
            this.setThreshold(metric, threshold);
        }
    }

    setThreshold(metric, threshold) {
        this.thresholds.set(metric, {
            min: threshold.min,
            max: threshold.max,
            critical: threshold.critical,
            enabled: threshold.enabled !== false
        });
    }

    subscribe(metric, callback) {
        if (!this.subscribers.has(metric)) {
            this.subscribers.set(metric, []);
        }
        this.subscribers.get(metric).push(callback);
    }

    detectAnomalies(data, metric, options = {}) {
        if (!Array.isArray(data) || data.length < this.config.minDataPoints) {
            return {
                anomalies: [],
                method: 'insufficient_data',
                confidence: 0,
                summary: 'Insufficient data points for anomaly detection'
            };
        }

        const values = data.map(d => typeof d === 'object' ? d.value : d);
        const timestamps = data.map(d => typeof d === 'object' ? d.timestamp : null);

        const zScoreAnomalies = this.detectZScoreAnomalies(values, timestamps);
        const iqrAnomalies = this.detectIQRAnomalies(values, timestamps);
        const thresholdAnomalies = this.detectThresholdAnomalies(values, timestamps, metric);
        const trendAnomalies = this.detectTrendAnomalies(values, timestamps);

        const combinedAnomalies = this.combineAnomalyResults([
            zScoreAnomalies,
            iqrAnomalies,
            thresholdAnomalies,
            trendAnomalies
        ]);

        if (combinedAnomalies.anomalies.length > 0) {
            this.generateAlerts(metric, combinedAnomalies);
        }

        return combinedAnomalies;
    }

    detectZScoreAnomalies(values, timestamps) {
        const mean = this.calculateMean(values);
        const stdDev = this.calculateStandardDeviation(values, mean);
        
        if (stdDev === 0) {
            return { anomalies: [], method: 'z_score', confidence: 0 };
        }

        const anomalies = [];
        
        values.forEach((value, index) => {
            const zScore = Math.abs((value - mean) / stdDev);
            
            if (zScore > this.config.zScoreThreshold) {
                anomalies.push({
                    index,
                    value,
                    timestamp: timestamps ? timestamps[index] : null,
                    zScore,
                    severity: zScore > 3 ? 'critical' : 'warning',
                    method: 'z_score',
                    description: `Value ${value} deviates ${zScore.toFixed(2)} standard deviations from mean`
                });
            }
        });

        return {
            anomalies,
            method: 'z_score',
            confidence: anomalies.length > 0 ? Math.min(0.9, anomalies.length / values.length * 10) : 0,
            statistics: { mean, stdDev, threshold: this.config.zScoreThreshold }
        };
    }

    detectIQRAnomalies(values, timestamps) {
        const sortedValues = [...values].sort((a, b) => a - b);
        const q1 = this.calculatePercentile(sortedValues, 25);
        const q3 = this.calculatePercentile(sortedValues, 75);
        const iqr = q3 - q1;
        
        const lowerBound = q1 - (this.config.iqrMultiplier * iqr);
        const upperBound = q3 + (this.config.iqrMultiplier * iqr);

        const anomalies = [];
        
        values.forEach((value, index) => {
            if (value < lowerBound || value > upperBound) {
                const deviation = value < lowerBound ? 
                    (lowerBound - value) / iqr : 
                    (value - upperBound) / iqr;
                
                anomalies.push({
                    index,
                    value,
                    timestamp: timestamps ? timestamps[index] : null,
                    deviation,
                    severity: deviation > 2 ? 'critical' : 'warning',
                    method: 'iqr',
                    description: `Value ${value} is ${deviation.toFixed(2)} IQR units outside normal range`
                });
            }
        });

        return {
            anomalies,
            method: 'iqr',
            confidence: anomalies.length > 0 ? Math.min(0.85, anomalies.length / values.length * 8) : 0,
            statistics: { q1, q3, iqr, lowerBound, upperBound }
        };
    }

    detectThresholdAnomalies(values, timestamps, metric) {
        const threshold = this.thresholds.get(metric);
        
        if (!threshold || !threshold.enabled) {
            return { anomalies: [], method: 'threshold', confidence: 0 };
        }

        const anomalies = [];
        
        values.forEach((value, index) => {
            let violation = null;
            let severity = 'warning';

            if (threshold.critical !== null && threshold.critical !== undefined) {
                if (typeof threshold.critical === 'number') {
                    if (value < threshold.critical) {
                        violation = 'critical_low';
                        severity = 'critical';
                    }
                } else if (typeof threshold.critical === 'object') {
                    if (threshold.critical.min !== null && value < threshold.critical.min) {
                        violation = 'critical_low';
                        severity = 'critical';
                    }
                    if (threshold.critical.max !== null && value > threshold.critical.max) {
                        violation = 'critical_high';
                        severity = 'critical';
                    }
                }
            }

            if (!violation) {
                if (threshold.min !== null && value < threshold.min) {
                    violation = 'threshold_low';
                }
                if (threshold.max !== null && value > threshold.max) {
                    violation = 'threshold_high';
                }
            }

            if (violation) {
                anomalies.push({
                    index,
                    value,
                    timestamp: timestamps ? timestamps[index] : null,
                    violation,
                    severity,
                    method: 'threshold',
                    description: `Value ${value} violates ${violation.replace('_', ' ')} threshold`
                });
            }
        });

        return {
            anomalies,
            method: 'threshold',
            confidence: anomalies.length > 0 ? 1.0 : 0,
            thresholds: threshold
        };
    }

    detectTrendAnomalies(values, timestamps) {
        if (values.length < 5) {
            return { anomalies: [], method: 'trend', confidence: 0 };
        }

        const windowSize = Math.min(5, Math.floor(values.length / 3));
        const anomalies = [];

        for (let i = windowSize; i < values.length - windowSize; i++) {
            const beforeWindow = values.slice(i - windowSize, i);
            const afterWindow = values.slice(i + 1, i + 1 + windowSize);
            
            const beforeTrend = this.calculateTrend(beforeWindow);
            const afterTrend = this.calculateTrend(afterWindow);
            
            const trendChange = Math.abs(afterTrend - beforeTrend);
            
            if (trendChange > this.config.trendChangeThreshold) {
                anomalies.push({
                    index: i,
                    value: values[i],
                    timestamp: timestamps ? timestamps[i] : null,
                    trendChange,
                    beforeTrend,
                    afterTrend,
                    severity: trendChange > 0.5 ? 'critical' : 'warning',
                    method: 'trend',
                    description: `Significant trend change detected: ${beforeTrend.toFixed(3)} to ${afterTrend.toFixed(3)}`
                });
            }
        }

        return {
            anomalies,
            method: 'trend',
            confidence: anomalies.length > 0 ? Math.min(0.8, anomalies.length / values.length * 5) : 0
        };
    }

    combineAnomalyResults(results) {
        const allAnomalies = [];
        const methodConfidences = {};

        results.forEach(result => {
            methodConfidences[result.method] = result.confidence;
            result.anomalies.forEach(anomaly => {
                allAnomalies.push(anomaly);
            });
        });

        const uniqueAnomalies = this.deduplicateAnomalies(allAnomalies);
        const overallConfidence = this.calculateOverallConfidence(methodConfidences);

        return {
            anomalies: uniqueAnomalies,
            method: 'combined',
            confidence: overallConfidence,
            methodResults: results,
            summary: this.generateAnomalySummary(uniqueAnomalies)
        };
    }

    deduplicateAnomalies(anomalies) {
        const indexMap = new Map();

        anomalies.forEach(anomaly => {
            const key = anomaly.index;
            
            if (!indexMap.has(key)) {
                indexMap.set(key, anomaly);
            } else {
                const existing = indexMap.get(key);
                const severityOrder = { 'critical': 3, 'warning': 2, 'info': 1 };
                
                if (severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
                    anomaly.methods = [existing.method, anomaly.method];
                    indexMap.set(key, anomaly);
                } else if (severityOrder[anomaly.severity] === severityOrder[existing.severity]) {
                    existing.methods = existing.methods || [existing.method];
                    existing.methods.push(anomaly.method);
                }
            }
        });

        return Array.from(indexMap.values());
    }

    calculateOverallConfidence(methodConfidences) {
        const confidences = Object.values(methodConfidences);
        const nonZeroConfidences = confidences.filter(c => c > 0);
        
        if (nonZeroConfidences.length === 0) return 0;
        
        const avgConfidence = nonZeroConfidences.reduce((sum, c) => sum + c, 0) / nonZeroConfidences.length;
        const agreementBonus = nonZeroConfidences.length > 1 ? 0.1 : 0;
        
        return Math.min(1.0, avgConfidence + agreementBonus);
    }

    generateAlerts(metric, anomalyResult) {
        const now = Date.now();
        const lastAlert = this.alertHistory.get(metric);
        
        if (lastAlert && (now - lastAlert) < this.config.alertCooldown) {
            return;
        }

        const criticalAnomalies = anomalyResult.anomalies.filter(a => a.severity === 'critical');
        const warningAnomalies = anomalyResult.anomalies.filter(a => a.severity === 'warning');

        if (criticalAnomalies.length > 0 || warningAnomalies.length > 0) {
            const alert = {
                metric,
                timestamp: now,
                severity: criticalAnomalies.length > 0 ? 'critical' : 'warning',
                anomalies: anomalyResult.anomalies,
                confidence: anomalyResult.confidence,
                summary: anomalyResult.summary,
                message: this.generateAlertMessage(metric, anomalyResult)
            };

            this.alertHistory.set(metric, now);
            this.notifySubscribers(metric, alert);
        }
    }

    generateAlertMessage(metric, anomalyResult) {
        const { anomalies, confidence } = anomalyResult;
        const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
        const warningCount = anomalies.filter(a => a.severity === 'warning').length;

        let message = `Anomaly detected in ${metric.replace('_', ' ')}: `;
        
        if (criticalCount > 0) {
            message += `${criticalCount} critical anomal${criticalCount > 1 ? 'ies' : 'y'}`;
            if (warningCount > 0) {
                message += ` and ${warningCount} warning${warningCount > 1 ? 's' : ''}`;
            }
        } else {
            message += `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
        }

        message += ` (confidence: ${(confidence * 100).toFixed(1)}%)`;
        return message;
    }

    notifySubscribers(metric, alert) {
        const subscribers = this.subscribers.get(metric) || [];
        
        subscribers.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error in anomaly alert callback:', error);
            }
        });
    }

    generateAnomalySummary(anomalies) {
        if (anomalies.length === 0) {
            return 'No anomalies detected';
        }

        const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
        const warningCount = anomalies.filter(a => a.severity === 'warning').length;

        let summary = `Found ${anomalies.length} anomal${anomalies.length > 1 ? 'ies' : 'y'}`;
        
        if (criticalCount > 0 && warningCount > 0) {
            summary += ` (${criticalCount} critical, ${warningCount} warnings)`;
        } else if (criticalCount > 0) {
            summary += ` (${criticalCount} critical)`;
        } else {
            summary += ` (${warningCount} warnings)`;
        }

        return summary;
    }

    // Statistical utility methods
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateStandardDeviation(values, mean = null) {
        if (mean === null) {
            mean = this.calculateMean(values);
        }
        
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        
        return Math.sqrt(variance);
    }

    calculatePercentile(sortedValues, percentile) {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) {
            return sortedValues[lower];
        }
        
        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;
        
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        return isNaN(slope) ? 0 : slope;
    }

    getLastAlert(metric) {
        return this.alertHistory.get(metric) || null;
    }

    clearAlertHistory(metric) {
        this.alertHistory.delete(metric);
    }

    getConfig() {
        return { ...this.config };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

describe('Anomaly Detection Consistency Properties', () => {
    let detector;

    beforeEach(() => {
        detector = new AnomalyDetector();
    });

    describe('Property 17: Anomaly Detection Consistency', () => {
        test('should maintain consistent detection across identical datasets', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 15, maxLength: 100 }),
                (values) => {
                    // Run detection multiple times on same data
                    const result1 = detector.detectAnomalies(values, 'test_metric');
                    const result2 = detector.detectAnomalies(values, 'test_metric');
                    
                    // Results should be identical
                    expect(result1.anomalies.length).toBe(result2.anomalies.length);
                    expect(result1.confidence).toBeCloseTo(result2.confidence, 5);
                    
                    // Anomaly indices should match
                    const indices1 = result1.anomalies.map(a => a.index).sort();
                    const indices2 = result2.anomalies.map(a => a.index).sort();
                    expect(indices1).toEqual(indices2);
                }
            ), { numRuns: 50 });
        });

        test('should detect obvious outliers consistently', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 90, max: 110 }), { minLength: 15, maxLength: 50 }),
                fc.float({ min: 500, max: 1000 }),
                fc.integer({ min: 0, max: 49 }),
                (normalValues, outlierValue, outlierIndex) => {
                    // Insert obvious outlier
                    const values = [...normalValues];
                    if (outlierIndex < values.length) {
                        values[outlierIndex] = outlierValue;
                    }
                    
                    const result = detector.detectAnomalies(values, 'test_metric');
                    
                    // Should detect the outlier
                    expect(result.anomalies.length).toBeGreaterThan(0);
                    
                    // Outlier should be in detected anomalies
                    const detectedIndices = result.anomalies.map(a => a.index);
                    if (outlierIndex < values.length) {
                        expect(detectedIndices).toContain(outlierIndex);
                    }
                }
            ), { numRuns: 30 });
        });

        test('should not detect anomalies in uniform data', () => {
            fc.assert(fc.property(
                fc.float({ min: 50, max: 150 }),
                fc.integer({ min: 15, max: 100 }),
                (constantValue, length) => {
                    const values = Array(length).fill(constantValue);
                    const result = detector.detectAnomalies(values, 'test_metric');
                    
                    // Uniform data should have no anomalies
                    expect(result.anomalies.length).toBe(0);
                    expect(result.confidence).toBe(0);
                }
            ), { numRuns: 20 });
        });

        test('should maintain confidence bounds', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 15, maxLength: 100 }),
                (values) => {
                    const result = detector.detectAnomalies(values, 'test_metric');
                    
                    // Confidence should be between 0 and 1
                    expect(result.confidence).toBeGreaterThanOrEqual(0);
                    expect(result.confidence).toBeLessThanOrEqual(1);
                    
                    // If anomalies detected, confidence should be > 0
                    if (result.anomalies.length > 0) {
                        expect(result.confidence).toBeGreaterThan(0);
                    }
                }
            ), { numRuns: 50 });
        });

        test('should handle threshold violations correctly', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 200 }), { minLength: 15, maxLength: 50 }),
                (values) => {
                    // Set known thresholds
                    detector.setThreshold('threshold_test', { min: 50, max: 150, critical: 25 });
                    
                    const result = detector.detectThresholdAnomalies(values, null, 'threshold_test');
                    
                    // Check that all detected anomalies actually violate thresholds
                    result.anomalies.forEach(anomaly => {
                        const value = anomaly.value;
                        const violatesThreshold = value < 50 || value > 150 || value < 25;
                        expect(violatesThreshold).toBe(true);
                    });
                    
                    // Check that all threshold violations are detected
                    values.forEach((value, index) => {
                        const violatesThreshold = value < 50 || value > 150 || value < 25;
                        if (violatesThreshold) {
                            const detectedIndices = result.anomalies.map(a => a.index);
                            expect(detectedIndices).toContain(index);
                        }
                    });
                }
            ), { numRuns: 30 });
        });

        test('should maintain Z-score mathematical properties', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 15, maxLength: 100 }),
                (values) => {
                    const result = detector.detectZScoreAnomalies(values, null);
                    
                    if (result.statistics && result.statistics.stdDev > 0) {
                        const { mean, stdDev, threshold } = result.statistics;
                        
                        // All detected anomalies should exceed Z-score threshold
                        result.anomalies.forEach(anomaly => {
                            const zScore = Math.abs((anomaly.value - mean) / stdDev);
                            expect(zScore).toBeGreaterThan(threshold);
                        });
                        
                        // Values within threshold should not be detected
                        values.forEach((value, index) => {
                            const zScore = Math.abs((value - mean) / stdDev);
                            if (zScore <= threshold) {
                                const detectedIndices = result.anomalies.map(a => a.index);
                                expect(detectedIndices).not.toContain(index);
                            }
                        });
                    }
                }
            ), { numRuns: 30 });
        });

        test('should maintain IQR mathematical properties', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 15, maxLength: 100 }),
                (values) => {
                    const result = detector.detectIQRAnomalies(values, null);
                    
                    if (result.statistics) {
                        const { q1, q3, iqr, lowerBound, upperBound } = result.statistics;
                        
                        // Verify IQR calculation
                        expect(iqr).toBeCloseTo(q3 - q1, 5);
                        
                        // All detected anomalies should be outside IQR bounds
                        result.anomalies.forEach(anomaly => {
                            const outsideBounds = anomaly.value < lowerBound || anomaly.value > upperBound;
                            expect(outsideBounds).toBe(true);
                        });
                        
                        // Values within bounds should not be detected
                        values.forEach((value, index) => {
                            if (value >= lowerBound && value <= upperBound) {
                                const detectedIndices = result.anomalies.map(a => a.index);
                                expect(detectedIndices).not.toContain(index);
                            }
                        });
                    }
                }
            ), { numRuns: 30 });
        });

        test('should handle edge cases gracefully', () => {
            // Test empty array
            const emptyResult = detector.detectAnomalies([], 'test_metric');
            expect(emptyResult.method).toBe('insufficient_data');
            expect(emptyResult.anomalies.length).toBe(0);
            
            // Test insufficient data
            const smallResult = detector.detectAnomalies([1, 2, 3], 'test_metric');
            expect(smallResult.method).toBe('insufficient_data');
            
            // Test single value repeated
            const constantResult = detector.detectAnomalies(Array(20).fill(100), 'test_metric');
            expect(constantResult.anomalies.length).toBe(0);
        });

        test('should maintain alert cooldown behavior', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 100 }), { minLength: 15, maxLength: 30 }),
                (values) => {
                    // Add obvious outlier to trigger alert
                    const testValues = [...values, 1000];
                    
                    let alertCount = 0;
                    detector.subscribe('cooldown_test', () => {
                        alertCount++;
                    });
                    
                    // First detection should trigger alert
                    detector.detectAnomalies(testValues, 'cooldown_test');
                    expect(alertCount).toBe(1);
                    
                    // Immediate second detection should not trigger alert (cooldown)
                    detector.detectAnomalies(testValues, 'cooldown_test');
                    expect(alertCount).toBe(1);
                }
            ), { numRuns: 10 });
        });

        test('should maintain trend detection mathematical properties', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 100 }), { minLength: 15, maxLength: 50 }),
                (baseValues) => {
                    // Create data with known trend change
                    const values = [...baseValues];
                    const changePoint = Math.floor(values.length / 2);
                    
                    // Add strong upward trend after change point
                    for (let i = changePoint; i < values.length; i++) {
                        values[i] += (i - changePoint) * 10; // Strong trend
                    }
                    
                    const result = detector.detectTrendAnomalies(values, null);
                    
                    // Should detect trend change near the change point
                    if (result.anomalies.length > 0) {
                        const changePointDetected = result.anomalies.some(anomaly => 
                            Math.abs(anomaly.index - changePoint) <= 3
                        );
                        expect(changePointDetected).toBe(true);
                    }
                }
            ), { numRuns: 20 });
        });

        test('should combine multiple detection methods consistently', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 50, max: 150 }), { minLength: 20, maxLength: 50 }),
                fc.float({ min: 500, max: 1000 }),
                (normalValues, outlierValue) => {
                    // Insert outlier
                    const values = [...normalValues];
                    values[Math.floor(values.length / 2)] = outlierValue;
                    
                    const combinedResult = detector.detectAnomalies(values, 'test_metric');
                    const zScoreResult = detector.detectZScoreAnomalies(values, null);
                    const iqrResult = detector.detectIQRAnomalies(values, null);
                    
                    // Combined result should have confidence >= individual methods
                    if (zScoreResult.confidence > 0 || iqrResult.confidence > 0) {
                        const maxIndividualConfidence = Math.max(
                            zScoreResult.confidence, 
                            iqrResult.confidence
                        );
                        expect(combinedResult.confidence).toBeGreaterThanOrEqual(maxIndividualConfidence);
                    }
                    
                    // Combined result should detect at least as many anomalies as strongest method
                    const maxIndividualAnomalies = Math.max(
                        zScoreResult.anomalies.length,
                        iqrResult.anomalies.length
                    );
                    expect(combinedResult.anomalies.length).toBeGreaterThanOrEqual(maxIndividualAnomalies);
                }
            ), { numRuns: 20 });
        });
    });

    describe('Statistical Utility Function Properties', () => {
        test('mean calculation should be mathematically correct', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: -1000, max: 1000 }), { minLength: 1, maxLength: 100 }),
                (values) => {
                    const calculatedMean = detector.calculateMean(values);
                    const expectedMean = values.reduce((sum, val) => sum + val, 0) / values.length;
                    
                    expect(calculatedMean).toBeCloseTo(expectedMean, 10);
                }
            ), { numRuns: 50 });
        });

        test('standard deviation should follow mathematical properties', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: -1000, max: 1000 }), { minLength: 2, maxLength: 100 }),
                (values) => {
                    const mean = detector.calculateMean(values);
                    const stdDev = detector.calculateStandardDeviation(values, mean);
                    
                    // Standard deviation should be non-negative
                    expect(stdDev).toBeGreaterThanOrEqual(0);
                    
                    // For constant values, std dev should be 0
                    const isConstant = values.every(v => Math.abs(v - values[0]) < 1e-10);
                    if (isConstant) {
                        expect(stdDev).toBeCloseTo(0, 5);
                    }
                }
            ), { numRuns: 50 });
        });

        test('percentile calculation should maintain ordering', () => {
            fc.assert(fc.property(
                fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 4, maxLength: 100 }),
                (values) => {
                    const sortedValues = [...values].sort((a, b) => a - b);
                    
                    const p25 = detector.calculatePercentile(sortedValues, 25);
                    const p50 = detector.calculatePercentile(sortedValues, 50);
                    const p75 = detector.calculatePercentile(sortedValues, 75);
                    
                    // Percentiles should maintain order
                    expect(p25).toBeLessThanOrEqual(p50);
                    expect(p50).toBeLessThanOrEqual(p75);
                    
                    // Percentiles should be within data range
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    expect(p25).toBeGreaterThanOrEqual(min);
                    expect(p75).toBeLessThanOrEqual(max);
                }
            ), { numRuns: 30 });
        });

        test('trend calculation should detect direction correctly', () => {
            // Test increasing trend
            const increasingValues = [1, 2, 3, 4, 5];
            const increasingTrend = detector.calculateTrend(increasingValues);
            expect(increasingTrend).toBeGreaterThan(0);
            
            // Test decreasing trend
            const decreasingValues = [5, 4, 3, 2, 1];
            const decreasingTrend = detector.calculateTrend(decreasingValues);
            expect(decreasingTrend).toBeLessThan(0);
            
            // Test flat trend
            const flatValues = [3, 3, 3, 3, 3];
            const flatTrend = detector.calculateTrend(flatValues);
            expect(Math.abs(flatTrend)).toBeCloseTo(0, 5);
        });
    });

    describe('Configuration and State Management Properties', () => {
        test('configuration updates should be applied correctly', () => {
            fc.assert(fc.property(
                fc.record({
                    zScoreThreshold: fc.float({ min: 1, max: 5 }),
                    iqrMultiplier: fc.float({ min: 0.5, max: 3 }),
                    trendChangeThreshold: fc.float({ min: 0.1, max: 1 }),
                    minDataPoints: fc.integer({ min: 5, max: 50 })
                }),
                (newConfig) => {
                    const oldConfig = detector.getConfig();
                    detector.updateConfig(newConfig);
                    const updatedConfig = detector.getConfig();
                    
                    // New values should be applied
                    expect(updatedConfig.zScoreThreshold).toBe(newConfig.zScoreThreshold);
                    expect(updatedConfig.iqrMultiplier).toBe(newConfig.iqrMultiplier);
                    expect(updatedConfig.trendChangeThreshold).toBe(newConfig.trendChangeThreshold);
                    expect(updatedConfig.minDataPoints).toBe(newConfig.minDataPoints);
                    
                    // Other values should remain unchanged
                    expect(updatedConfig.alertCooldown).toBe(oldConfig.alertCooldown);
                }
            ), { numRuns: 20 });
        });

        test('threshold management should work correctly', () => {
            fc.assert(fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.record({
                    min: fc.option(fc.float({ min: 0, max: 100 })),
                    max: fc.option(fc.float({ min: 100, max: 1000 })),
                    critical: fc.option(fc.float({ min: 0, max: 50 }))
                }),
                (metricName, threshold) => {
                    detector.setThreshold(metricName, threshold);
                    
                    // Test that threshold is applied in detection
                    const testValues = [
                        threshold.min ? threshold.min - 10 : 0,
                        threshold.max ? threshold.max + 10 : 200,
                        50 // Normal value
                    ];
                    
                    const result = detector.detectThresholdAnomalies(testValues, null, metricName);
                    
                    // Should detect violations if thresholds are set
                    if (threshold.min !== null || threshold.max !== null) {
                        expect(result.anomalies.length).toBeGreaterThan(0);
                    }
                }
            ), { numRuns: 20 });
        });
    });
});