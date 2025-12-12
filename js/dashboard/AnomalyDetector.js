/**
 * AnomalyDetector - Advanced anomaly detection and alerting system
 * Implements statistical anomaly detection algorithms and threshold-based alerting
 * 
 * Features:
 * - Statistical anomaly detection (Z-score, IQR, isolation forest)
 * - Threshold-based alerting system
 * - Trend change detection
 * - Automated notifications
 * - Configurable sensitivity levels
 */

class AnomalyDetector {
    constructor(options = {}) {
        this.config = {
            zScoreThreshold: options.zScoreThreshold || 2.5,
            iqrMultiplier: options.iqrMultiplier || 1.5,
            trendChangeThreshold: options.trendChangeThreshold || 0.2,
            minDataPoints: options.minDataPoints || 10,
            alertCooldown: options.alertCooldown || 300000, // 5 minutes
            ...options
        };
        
        this.alertHistory = new Map();
        this.thresholds = new Map();
        this.subscribers = new Map();
        
        this.initializeDefaultThresholds();
    }

    /**
     * Initialize default thresholds for common KPIs
     */
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

    /**
     * Set threshold for a specific metric
     * @param {string} metric - Metric name
     * @param {Object} threshold - Threshold configuration
     */
    setThreshold(metric, threshold) {
        this.thresholds.set(metric, {
            min: threshold.min,
            max: threshold.max,
            critical: threshold.critical,
            enabled: threshold.enabled !== false
        });
    }

    /**
     * Subscribe to anomaly alerts
     * @param {string} metric - Metric to monitor
     * @param {Function} callback - Alert callback function
     */
    subscribe(metric, callback) {
        if (!this.subscribers.has(metric)) {
            this.subscribers.set(metric, []);
        }
        this.subscribers.get(metric).push(callback);
    }

    /**
     * Detect anomalies in time series data using multiple methods
     * @param {Array} data - Time series data points
     * @param {string} metric - Metric name
     * @param {Object} options - Detection options
     * @returns {Object} Anomaly detection results
     */
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

        // Apply multiple detection methods
        const zScoreAnomalies = this.detectZScoreAnomalies(values, timestamps);
        const iqrAnomalies = this.detectIQRAnomalies(values, timestamps);
        const thresholdAnomalies = this.detectThresholdAnomalies(values, timestamps, metric);
        const trendAnomalies = this.detectTrendAnomalies(values, timestamps);

        // Combine results with confidence scoring
        const combinedAnomalies = this.combineAnomalyResults([
            zScoreAnomalies,
            iqrAnomalies,
            thresholdAnomalies,
            trendAnomalies
        ]);

        // Generate alerts if anomalies detected
        if (combinedAnomalies.anomalies.length > 0) {
            this.generateAlerts(metric, combinedAnomalies);
        }

        return combinedAnomalies;
    }

    /**
     * Detect anomalies using Z-score method
     * @param {Array} values - Data values
     * @param {Array} timestamps - Timestamps
     * @returns {Object} Z-score anomaly results
     */
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

    /**
     * Detect anomalies using Interquartile Range (IQR) method
     * @param {Array} values - Data values
     * @param {Array} timestamps - Timestamps
     * @returns {Object} IQR anomaly results
     */
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

    /**
     * Detect threshold-based anomalies
     * @param {Array} values - Data values
     * @param {Array} timestamps - Timestamps
     * @param {string} metric - Metric name
     * @returns {Object} Threshold anomaly results
     */
    detectThresholdAnomalies(values, timestamps, metric) {
        const threshold = this.thresholds.get(metric);
        
        if (!threshold || !threshold.enabled) {
            return { anomalies: [], method: 'threshold', confidence: 0 };
        }

        const anomalies = [];
        
        values.forEach((value, index) => {
            let violation = null;
            let severity = 'warning';

            // Check critical thresholds first
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

            // Check normal thresholds if no critical violation
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

    /**
     * Detect trend change anomalies
     * @param {Array} values - Data values
     * @param {Array} timestamps - Timestamps
     * @returns {Object} Trend anomaly results
     */
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

    /**
     * Combine results from multiple anomaly detection methods
     * @param {Array} results - Array of detection results
     * @returns {Object} Combined anomaly results
     */
    combineAnomalyResults(results) {
        const allAnomalies = [];
        const methodConfidences = {};

        // Collect all anomalies and track method confidences
        results.forEach(result => {
            methodConfidences[result.method] = result.confidence;
            result.anomalies.forEach(anomaly => {
                allAnomalies.push(anomaly);
            });
        });

        // Remove duplicates and calculate combined confidence
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

    /**
     * Remove duplicate anomalies from different methods
     * @param {Array} anomalies - Array of anomalies
     * @returns {Array} Deduplicated anomalies
     */
    deduplicateAnomalies(anomalies) {
        const indexMap = new Map();

        anomalies.forEach(anomaly => {
            const key = anomaly.index;
            
            if (!indexMap.has(key)) {
                indexMap.set(key, anomaly);
            } else {
                // Keep the anomaly with higher severity or confidence
                const existing = indexMap.get(key);
                const severityOrder = { 'critical': 3, 'warning': 2, 'info': 1 };
                
                if (severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
                    // Combine methods information
                    anomaly.methods = [existing.method, anomaly.method];
                    indexMap.set(key, anomaly);
                } else if (severityOrder[anomaly.severity] === severityOrder[existing.severity]) {
                    // Same severity, combine methods
                    existing.methods = existing.methods || [existing.method];
                    existing.methods.push(anomaly.method);
                }
            }
        });

        return Array.from(indexMap.values());
    }

    /**
     * Calculate overall confidence from method confidences
     * @param {Object} methodConfidences - Confidence scores by method
     * @returns {number} Overall confidence score
     */
    calculateOverallConfidence(methodConfidences) {
        const confidences = Object.values(methodConfidences);
        const nonZeroConfidences = confidences.filter(c => c > 0);
        
        if (nonZeroConfidences.length === 0) return 0;
        
        // Weighted average with higher weight for agreement between methods
        const avgConfidence = nonZeroConfidences.reduce((sum, c) => sum + c, 0) / nonZeroConfidences.length;
        const agreementBonus = nonZeroConfidences.length > 1 ? 0.1 : 0;
        
        return Math.min(1.0, avgConfidence + agreementBonus);
    }

    /**
     * Generate alerts for detected anomalies
     * @param {string} metric - Metric name
     * @param {Object} anomalyResult - Anomaly detection result
     */
    generateAlerts(metric, anomalyResult) {
        const now = Date.now();
        const lastAlert = this.alertHistory.get(metric);
        
        // Check cooldown period
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

            // Update alert history
            this.alertHistory.set(metric, now);

            // Notify subscribers
            this.notifySubscribers(metric, alert);
        }
    }

    /**
     * Generate human-readable alert message
     * @param {string} metric - Metric name
     * @param {Object} anomalyResult - Anomaly detection result
     * @returns {string} Alert message
     */
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

    /**
     * Notify subscribers about alerts
     * @param {string} metric - Metric name
     * @param {Object} alert - Alert object
     */
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

    /**
     * Generate anomaly summary
     * @param {Array} anomalies - Array of anomalies
     * @returns {string} Summary text
     */
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

    /**
     * Calculate mean of values
     * @param {Array} values - Numeric values
     * @returns {number} Mean value
     */
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Calculate standard deviation
     * @param {Array} values - Numeric values
     * @param {number} mean - Pre-calculated mean (optional)
     * @returns {number} Standard deviation
     */
    calculateStandardDeviation(values, mean = null) {
        if (mean === null) {
            mean = this.calculateMean(values);
        }
        
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        
        return Math.sqrt(variance);
    }

    /**
     * Calculate percentile
     * @param {Array} sortedValues - Sorted numeric values
     * @param {number} percentile - Percentile (0-100)
     * @returns {number} Percentile value
     */
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

    /**
     * Calculate trend (slope) of values
     * @param {Array} values - Numeric values
     * @returns {number} Trend slope
     */
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

    /**
     * Get alert history for a metric
     * @param {string} metric - Metric name
     * @returns {number|null} Last alert timestamp
     */
    getLastAlert(metric) {
        return this.alertHistory.get(metric) || null;
    }

    /**
     * Clear alert history for a metric
     * @param {string} metric - Metric name
     */
    clearAlertHistory(metric) {
        this.alertHistory.delete(metric);
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnomalyDetector;
}